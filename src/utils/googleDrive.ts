// Minimal Google Drive REST API v3 client, called directly from the browser
// with the OAuth access token obtained via googleAuth.ts. No backend needed.
//
// Photos are kept inside a single app folder ("BolAitor 3D Globe") in the
// signed-in user's own Drive, using the "drive.file" scope: this app can
// only see/manage the files it creates, never the rest of the user's Drive.

const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
export const APP_FOLDER_NAME = 'BolAitor 3D Globe';

export interface DrivePhoto {
  id: string;
  name: string;
  url: string; // local object URL, safe to use as an <img>/texture src
}

async function driveFetch(accessToken: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message || '';
    } catch {
      // ignore
    }
    throw new Error(`Error de Google Drive (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res;
}

/**
 * Finds (or creates, on first use) the app's dedicated folder in the user's
 * Drive, where all globe photos are stored.
 */
export async function ensureAppFolder(accessToken: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await driveFetch(accessToken, `${DRIVE_FILES_API}?q=${q}&fields=files(id,name)&spaces=drive`);
  const searchData = await searchRes.json();
  if (searchData.files?.length) {
    return searchData.files[0].id as string;
  }

  const createRes = await driveFetch(accessToken, DRIVE_FILES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: APP_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const created = await createRes.json();
  return created.id as string;
}

/**
 * Uploads one photo into the app's Drive folder.
 */
export async function uploadPhotoToDrive(
  accessToken: string,
  folderId: string,
  file: Blob,
  filename: string
): Promise<DrivePhoto> {
  const metadata = { name: filename, parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await driveFetch(accessToken, `${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id,name`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  // We already have the bytes locally — no need to re-download them.
  const url = URL.createObjectURL(file);
  return { id: data.id, name: data.name, url };
}

/**
 * Lists and downloads every image previously stored in the app's Drive
 * folder, so a returning user's globe can be rebuilt.
 */
export async function listDrivePhotos(accessToken: string, folderId: string): Promise<DrivePhoto[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType contains 'image/'`);
  const res = await driveFetch(
    accessToken,
    `${DRIVE_FILES_API}?q=${q}&fields=files(id,name)&orderBy=name&spaces=drive&pageSize=200`
  );
  const data = await res.json();
  const files: { id: string; name: string }[] = data.files || [];

  const photos: DrivePhoto[] = [];
  for (const f of files) {
    try {
      const contentRes = await driveFetch(accessToken, `${DRIVE_FILES_API}/${f.id}?alt=media`);
      const blob = await contentRes.blob();
      photos.push({ id: f.id, name: f.name, url: URL.createObjectURL(blob) });
    } catch (e) {
      console.error('No se pudo descargar una foto de Drive:', f.name, e);
    }
  }
  return photos;
}

export async function deleteDrivePhoto(accessToken: string, fileId: string): Promise<void> {
  await driveFetch(accessToken, `${DRIVE_FILES_API}/${fileId}`, { method: 'DELETE' });
}
