export async function runOcr(file, onProgress) {
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js failed to load');
  }
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m) => {
      if (onProgress) onProgress(m);
    },
  });
  return data.text || '';
}
