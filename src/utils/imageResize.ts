// Resizes and compresses an image blob entirely in the browser, before it
// ever becomes a texture or gets uploaded to Drive. Phone photos are
// routinely 3000-4000px wide and several MB — none of that extra detail is
// visible on a globe card, so shrinking it upfront saves decode time,
// GPU memory, Drive quota, and bandwidth for anyone viewing a shared globe.

const MAX_DIMENSION = 1600; // px, generous for how large a card ever appears on screen
const JPEG_QUALITY = 0.85;

function shouldPreserveTransparency(mimeType: string): boolean {
  return mimeType === 'image/png' || mimeType === 'image/gif';
}

/**
 * Resizes `blob` down to at most MAX_DIMENSION on its longest side and
 * re-encodes it (JPEG for photos, PNG when the source might have
 * transparency). Returns the original blob unchanged if it's already
 * within bounds or if resizing fails for any reason — this is a
 * best-effort optimization, never a hard requirement.
 */
export async function resizeImageBlob(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const { width, height } = bitmap;

    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      bitmap.close();
      return blob;
    }

    const scale = MAX_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return blob;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const outputType = shouldPreserveTransparency(blob.type) ? 'image/png' : 'image/jpeg';
    const resizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, JPEG_QUALITY);
    });

    // Only use the resized version if it actually helped.
    if (resizedBlob && resizedBlob.size < blob.size) {
      return resizedBlob;
    }
    return resizedBlob || blob;
  } catch (e) {
    console.error('No se pudo redimensionar la imagen, se usará el original:', e);
    return blob;
  }
}
