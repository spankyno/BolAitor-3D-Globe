import JSZip from 'jszip';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

function hasImageExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Reads a list of plain image files (from an <input type="file" multiple>)
 * and returns object URLs ready to be used as globe card textures.
 */
export async function extractImagesFromFiles(files: File[]): Promise<string[]> {
  return files
    .filter((file) => file.type.startsWith('image/') || hasImageExtension(file.name))
    .map((file) => URL.createObjectURL(file));
}

/**
 * Reads a .zip file, extracts every image entry found inside it (at any
 * folder depth) and returns object URLs ready to be used as globe card
 * textures, along with the raw blobs and filenames (useful for uploading
 * them elsewhere, e.g. to Google Drive). Everything happens client-side,
 * no upload to any server unless the caller explicitly does so.
 */
export async function extractImagesFromZip(
  zipFile: File
): Promise<{ urls: string[]; blobs: Blob[]; names: string[] }> {
  const zip = await JSZip.loadAsync(zipFile);
  const imageEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && hasImageExtension(entry.name)
  );

  // Keep a stable, predictable order (alphabetical by path).
  imageEntries.sort((a, b) => a.name.localeCompare(b.name));

  const urls: string[] = [];
  const blobs: Blob[] = [];
  const names: string[] = [];
  for (const entry of imageEntries) {
    const blob = await entry.async('blob');
    urls.push(URL.createObjectURL(blob));
    blobs.push(blob);
    // Use just the file's base name (drop any folder path from inside the zip).
    names.push(entry.name.split('/').pop() || entry.name);
  }
  return { urls, blobs, names };
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
