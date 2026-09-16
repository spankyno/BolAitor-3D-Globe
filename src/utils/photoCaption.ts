export const DEFAULT_PHOTO_DESCRIPTION = 'Imagen subida por el usuario para su galería personalizada.';

/**
 * Derives a reasonable default title from a filename, e.g.
 * "playa_de_cadiz-2024.JPG" -> "playa de cadiz 2024". Falls back to
 * `fallback` if nothing usable is left after cleanup.
 */
export function titleFromFilename(filename: string, fallback: string): string {
  const withoutExtension = filename.replace(/\.[a-zA-Z0-9]+$/, '');
  const cleaned = withoutExtension.replace(/[_-]+/g, ' ').trim();
  return cleaned || fallback;
}
