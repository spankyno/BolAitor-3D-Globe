import { resizeImageBlob } from './imageResize';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

function hasImageExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Reads a list of plain image files (from an <input type="file" multiple>),
 * downscales/compresses each one (see imageResize.ts) and returns object
 * URLs ready to be used as globe card textures, along with the resized
 * blobs and filenames — the same resized bytes should be what gets
 * uploaded to Drive, so nothing gets uploaded twice at different sizes.
 */
export async function extractImagesFromFiles(
  files: File[]
): Promise<{ urls: string[]; blobs: Blob[]; names: string[] }> {
  const imageFiles = files.filter((file) => file.type.startsWith('image/') || hasImageExtension(file.name));

  // Resize in parallel — these are independent, CPU/GPU-bound operations.
  const resizedBlobs = await Promise.all(imageFiles.map((file) => resizeImageBlob(file)));

  return {
    urls: resizedBlobs.map((blob) => URL.createObjectURL(blob)),
    blobs: resizedBlobs,
    names: imageFiles.map((f) => f.name),
  };
}

/**
 * Reads a .zip file, extracts every image entry found inside it (at any
 * folder depth), downscales/compresses each one, and returns object URLs
 * ready to be used as globe card textures, along with the resized blobs
 * and filenames (useful for uploading them elsewhere, e.g. to Google
 * Drive). Everything happens client-side, no upload to any server unless
 * the caller explicitly does so.
 */
export async function extractImagesFromZip(
  zipFile: File
): Promise<{ urls: string[]; blobs: Blob[]; names: string[] }> {
  // Loaded on demand: most sessions never touch a .zip file, so this
  // keeps JSZip out of the bundle everyone else downloads.
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(zipFile);
  const imageEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && hasImageExtension(entry.name)
  );

  // Keep a stable, predictable order (alphabetical by path).
  imageEntries.sort((a, b) => a.name.localeCompare(b.name));

  // Extract + resize in parallel rather than one entry at a time.
  const results = await Promise.all(
    imageEntries.map(async (entry) => {
      const rawBlob = await entry.async('blob');
      const blob = await resizeImageBlob(rawBlob);
      return {
        url: URL.createObjectURL(blob),
        blob,
        // Use just the file's base name (drop any folder path from inside the zip).
        name: entry.name.split('/').pop() || entry.name,
      };
    })
  );

  return {
    urls: results.map((r) => r.url),
    blobs: results.map((r) => r.blob),
    names: results.map((r) => r.name),
  };
}

/**
 * Revokes previously created object URLs to free memory.
 */
export function revokeImageUrls(urls: string[]): void {
  urls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore — URL might already be invalid.
    }
  });
}
