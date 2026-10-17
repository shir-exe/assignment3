/**
 * Video frame extraction and pre-processing utilities for ONNX attention model
 */

/**
 * Extracts a normalized float32 tensor array from an HTMLVideoElement
 * @param {HTMLVideoElement} videoElement
 * @param {number} targetWidth - Model input width (e.g. 224)
 * @param {number} targetHeight - Model input height (e.g. 224)
 * @returns {Float32Array|null}
 */
export const extractFrameTensor = (videoElement, targetWidth = 224, targetHeight = 224) => {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Draw current frame scaled to model dimensions
  ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;

  // Planar RGB tensor [1, 3, targetHeight, targetWidth] normalized to [0, 1]
  const totalPixels = targetWidth * targetHeight;
  const tensor = new Float32Array(3 * totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4] / 255.0;
    const g = data[i * 4 + 1] / 255.0;
    const b = data[i * 4 + 2] / 255.0;

    tensor[i] = r;                    // Channel R
    tensor[totalPixels + i] = g;      // Channel G
    tensor[2 * totalPixels + i] = b;  // Channel B
  }

  return tensor;
};
