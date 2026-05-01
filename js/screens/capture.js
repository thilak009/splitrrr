import { runOcr } from '../ocr.js';
import { parseBillText } from '../parser.js';

export function renderCapture({ onParsed, onSkip }) {
  const fileInput = document.getElementById('bill-image');
  const previewWrap = document.getElementById('capture-preview-wrap');
  const previewImg = document.getElementById('capture-preview');
  const runBtn = document.getElementById('run-ocr-btn');
  const progressWrap = document.getElementById('ocr-progress');
  const progressFill = document.getElementById('ocr-progress-fill');
  const progressLabel = document.getElementById('ocr-progress-label');
  const skipBtn = document.getElementById('skip-ocr-btn');

  let currentFile = null;

  fileInput.value = '';
  previewWrap.hidden = true;
  progressWrap.hidden = true;
  progressFill.style.width = '0%';
  progressLabel.textContent = 'Starting…';

  fileInput.onchange = () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    currentFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewWrap.hidden = false;
    progressWrap.hidden = true;
  };

  runBtn.onclick = async () => {
    if (!currentFile) return;
    runBtn.disabled = true;
    progressWrap.hidden = false;
    try {
      const text = await runOcr(currentFile, (m) => {
        if (m.status) progressLabel.textContent = m.status;
        if (typeof m.progress === 'number') {
          progressFill.style.width = Math.round(m.progress * 100) + '%';
        }
      });
      const parsed = parseBillText(text);
      onParsed({ parsed });
    } catch (err) {
      progressLabel.textContent = 'Reading failed: ' + (err?.message || err);
    } finally {
      runBtn.disabled = false;
    }
  };

  skipBtn.onclick = () => {
    onSkip();
  };
}
