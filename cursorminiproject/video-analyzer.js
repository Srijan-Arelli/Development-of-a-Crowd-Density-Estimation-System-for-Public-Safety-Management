// CrowdWatch — Video analysis with person detection

document.addEventListener('DOMContentLoaded', () => {
  initVideoAnalyzer();
});

function initVideoAnalyzer() {
  const dropzone = document.getElementById('dropzone');
  const videoInput = document.getElementById('video-input');
  const previewArea = document.getElementById('preview-area');
  const videoPreview = document.getElementById('video-preview');
  const analyzeBtn = document.getElementById('analyze-btn');
  const clearBtn = document.getElementById('clear-btn');
  const statusArea = document.getElementById('status-area');
  const resultsArea = document.getElementById('results-area');
  const resultCount = document.getElementById('result-count');
  const resultDensity = document.getElementById('result-density');

  let currentFile = null;
  let cocoModel = null;

  const setStatus = (msg, isError = false) => {
    statusArea.textContent = msg;
    statusArea.className = 'video-analyzer__status' + (isError ? ' video-analyzer__status--error' : '');
  };

  // Click to upload
  dropzone.addEventListener('click', () => videoInput?.click());

  // File selected
  videoInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      loadVideo(file);
    } else if (file) {
      setStatus('Please select a video file (MP4, WebM, etc.).', true);
    }
  });

  // Drag and drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('video-analyzer__dropzone--active');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('video-analyzer__dropzone--active');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('video-analyzer__dropzone--active');
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('video/')) {
      loadVideo(file);
    } else if (file) {
      setStatus('Please drop a video file.', true);
    }
  });

  function loadVideo(file) {
    currentFile = file;
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    videoPreview.onloadedmetadata = () => {
      previewArea.style.display = 'block';
      resultsArea.style.display = 'none';
      setStatus('Video loaded. Click "Analyze Video" to run person detection.');
    };
    videoPreview.onerror = () => {
      setStatus('Failed to load video. Try another format (MP4 recommended).', true);
    };
    videoInput.value = '';
  }

  analyzeBtn?.addEventListener('click', async () => {
    if (!currentFile || !videoPreview.src) {
      setStatus('Please select a video first.', true);
      return;
    }

    setStatus('Loading AI model...');
    analyzeBtn.disabled = true;

    try {
      if (!cocoModel) {
        cocoModel = await cocoSsd.load({ base: 'mobilenet_v2' });
      }
    } catch (err) {
      setStatus('Failed to load AI model. Check your internet connection.', true);
      analyzeBtn.disabled = false;
      return;
    }

    setStatus('Analyzing video frames...');
    videoPreview.currentTime = 0;

    const counts = [];
    const sampleCount = 5;
    const duration = videoPreview.duration;

    for (let i = 0; i < sampleCount; i++) {
      const time = (duration * (i + 0.5)) / sampleCount;
      await seekTo(time);
      const count = await detectPeople(videoPreview, cocoModel);
      counts.push(count);
      setStatus(`Analyzed frame ${i + 1} of ${sampleCount} (${count} people)...`);
    }

    const maxCount = Math.max(...counts);
    const avgCount = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

    // Use max as approximate peak count; combine with average for overall estimate
    const approxPeople = Math.round((maxCount * 0.7 + avgCount * 0.3) * 1.15); // slight uplift for occluded people
    const density = getDensityLevel(approxPeople);

    resultCount.textContent = approxPeople;
    resultDensity.textContent = density;
    resultDensity.className = 'result-card__value result-card__value--density result-card__value--' + density.toLowerCase();
    resultsArea.style.display = 'block';
    setStatus('Analysis complete.');
    analyzeBtn.disabled = false;
  });

  clearBtn?.addEventListener('click', () => {
    currentFile = null;
    videoPreview.src = '';
    previewArea.style.display = 'none';
    resultsArea.style.display = 'none';
    statusArea.textContent = '';
  });
}

function getDensityLevel(count) {
  if (count < 10) return 'Low';
  if (count < 35) return 'Moderate';
  return 'High';
}

function seekTo(time) {
  const video = document.getElementById('video-preview');
  return new Promise((resolve) => {
    const done = () => {
      video.onseeked = null;
      setTimeout(resolve, 120); // allow frame to decode
    };
    video.onseeked = done;
    video.currentTime = time;
  });
}

async function detectPeople(video, model) {
  const canvas = document.getElementById('analysis-canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const predictions = await model.detect(canvas);
  const people = predictions.filter((p) => p.class === 'person');
  return people.length;
}
