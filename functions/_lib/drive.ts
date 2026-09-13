const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType?: string;
  parents?: string[];
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
      const errBody = (await res.json()) as { error?: { message?: string } };
      detail = errBody?.error?.message || '';
    } catch {
      // ignore
    }
    throw new Error(`Drive API error (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res;
}

export async function getFolderName(accessToken: string, folderId: string): Promise<string> {
  const res = await driveFetch(accessToken, `${DRIVE_FILES_API}/${folderId}?fields=name`);
  const data = (await res.json()) as { name: string };
  return data.name;
}

export async function listFolderImages(accessToken: string, folderId: string): Promise<DriveFileMeta[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType contains 'image/'`);
  const res = await driveFetch(
    accessToken,
    `${DRIVE_FILES_API}?q=${q}&fields=files(id,name,mimeType)&orderBy=name&spaces=drive&pageSize=200`
  );
  const data = (await res.json()) as { files?: DriveFileMeta[] };
  return data.files || [];
}

export async function getFileMeta(accessToken: string, fileId: string): Promise<DriveFileMeta> {
  const res = await driveFetch(accessToken, `${DRIVE_FILES_API}/${fileId}?fields=id,name,mimeType,parents`);
  return (await res.json()) as DriveFileMeta;
}

export async function fetchFileContent(accessToken: string, fileId: string): Promise<Response> {
  return driveFetch(accessToken, `${DRIVE_FILES_API}/${fileId}?alt=media`);
}
