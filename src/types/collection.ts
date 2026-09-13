// A "globo" (collection) is a named set of photos. It may or may not be
// synced to a Google Drive subfolder, depending on whether the user is
// signed in.
export interface Collection {
  id: string; // Drive folder id when synced, otherwise a local-only id
  name: string;
  photos: string[]; // object URLs — lazily loaded for Drive-backed collections
  photosLoaded: boolean;
  driveFolderId?: string;
  /** Known photo count from Drive before the photos themselves are loaded. */
  photoCount?: number;
}

export function makeLocalCollectionId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
