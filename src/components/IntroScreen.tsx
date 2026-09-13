import { Camera, Upload, ArrowRight, Compass, Images, FileArchive, X, Loader2, Cloud, CloudOff, ArrowLeft, Pencil, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { extractImagesFromFiles, extractImagesFromZip, revokeImageUrls } from '../utils/customPhotos';
import {
  countPhotosInFolder,
  createCollection,
  deleteCollectionFolder,
  deleteDrivePhoto,
  ensureAppFolder,
  listCollections,
  listDrivePhotos,
  renameCollection,
  uploadPhotoToDrive,
} from '../utils/googleDrive';
import { useDriveAuth } from '../context/DriveAuthContext';
import { AccountPill, ConnectDriveButton, SignInPrompt } from './ClerkAuth';
import CollectionsScreen from './CollectionsScreen';
import ShareControl from './ShareControl';
import { makeLocalCollectionId, type Collection } from '../types/collection';

interface IntroScreenProps {
  onStart: (photoBase64: string, customPhotos?: string[]) => void;
}

type Mode = 'menu' | 'collections' | 'gallery' | 'camera' | 'preview';

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [mode, setMode] = useState<Mode>('menu');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    configured: driveConfigured,
    isSignedIn,
    userEmail,
    hasGoogleAccount,
    getDriveAccessToken,
  } = useDriveAuth();

  // --- Collections ("globos" con nombre) ---
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [restoringCollection, setRestoringCollection] = useState(false);
  const [driveRootFolderId, setDriveRootFolderId] = useState<string | null>(null);
  const collectionsRestored = useRef(false);
  // collectionId -> (object URL -> Drive file id), for photos synced to Drive.
  const driveIdsRef = useRef<Map<string, Map<string, string>>>(new Map());

  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [driveError, setDriveError] = useState<string | null>(null);

  const [renamingActive, setRenamingActive] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || null;

  function getCollectionDriveIds(collectionId: string): Map<string, string> {
    let m = driveIdsRef.current.get(collectionId);
    if (!m) {
      m = new Map();
      driveIdsRef.current.set(collectionId, m);
    }
    return m;
  }

  // Once signed in (via Clerk), restore the user's saved collections from
  // their Drive app folder.
  useEffect(() => {
    if (!isSignedIn || collectionsRestored.current) return;
    collectionsRestored.current = true;
    setDriveError(null);
    setCollectionsLoading(true);
    (async () => {
      try {
        const token = await getDriveAccessToken();
        const rootId = await ensureAppFolder(token);
        setDriveRootFolderId(rootId);

        const subfolders = await listCollections(token, rootId);
        const loaded: Collection[] = [];
        for (const sf of subfolders) {
          const count = await countPhotosInFolder(token, sf.id);
          loaded.push({ id: sf.id, name: sf.name, photos: [], photosLoaded: false, driveFolderId: sf.id, photoCount: count });
        }
        // Backwards-compatibility: photos uploaded before "collections"
        // existed sit loose in the root folder — surface them as a
        // collection too, so nothing gets orphaned.
        const looseCount = await countPhotosInFolder(token, rootId);
        if (looseCount > 0) {
          loaded.unshift({
            id: rootId,
            name: 'Fotos sin agrupar',
            photos: [],
            photosLoaded: false,
            driveFolderId: rootId,
            photoCount: looseCount,
          });
        }

        if (loaded.length > 0) {
          setCollections((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            return [...prev, ...loaded.filter((l) => !existingIds.has(l.id))];
          });
          setMode((m) => (m === 'menu' ? 'collections' : m));
        }
      } catch (e) {
        console.error(e);
        setDriveError(e instanceof Error ? e.message : 'No se pudieron cargar tus globos guardados en Drive.');
      } finally {
        setCollectionsLoading(false);
      }
    })();
  }, [isSignedIn, getDriveAccessToken]);

  useEffect(() => {
    if (!isSignedIn) {
      collectionsRestored.current = false;
      setDriveRootFolderId(null);
    }
  }, [isSignedIn]);

  const goToMenu = () => {
    stopCamera();
    setPreviewUrl(null);
    setMode('menu');
  };

  const goToCollections = () => {
    stopCamera();
    setMode('collections');
  };

  const handleStart = (url: string) => {
    onStart(url);
  };

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera access denied or unavailable", e);
      setMode('menu');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const w = videoRef.current.videoWidth;
      const h = videoRef.current.videoHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, w, h);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPreviewUrl(dataUrl);
        stopCamera();
        setMode('preview');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Collection management ---

  const handleCreateCollection = async (name: string) => {
    setCreatingCollection(true);
    setDriveError(null);
    try {
      if (isSignedIn) {
        let rootId = driveRootFolderId;
        const token = await getDriveAccessToken();
        if (!rootId) {
          rootId = await ensureAppFolder(token);
          setDriveRootFolderId(rootId);
        }
        const folder = await createCollection(token, rootId, name);
        setCollections((prev) => [
          ...prev,
          { id: folder.id, name: folder.name, photos: [], photosLoaded: true, driveFolderId: folder.id, photoCount: 0 },
        ]);
      } else {
        setCollections((prev) => [...prev, { id: makeLocalCollectionId(), name, photos: [], photosLoaded: true }]);
      }
    } catch (e) {
      console.error(e);
      setDriveError('No se pudo crear el globo en Google Drive; se ha creado solo en este navegador.');
      setCollections((prev) => [...prev, { id: makeLocalCollectionId(), name, photos: [], photosLoaded: true }]);
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleOpenCollection = async (id: string) => {
    const col = collections.find((c) => c.id === id);
    if (!col) return;
    setActiveCollectionId(id);
    setMode('gallery');

    if (col.driveFolderId && !col.photosLoaded && isSignedIn) {
      setRestoringCollection(true);
      setDriveError(null);
      try {
        const token = await getDriveAccessToken();
        const photos = await listDrivePhotos(token, col.driveFolderId);
        const idsMap = getCollectionDriveIds(id);
        photos.forEach((p) => idsMap.set(p.url, p.id));
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, photos: photos.map((p) => p.url), photosLoaded: true } : c))
        );
      } catch (e) {
        console.error(e);
        setDriveError('No se pudieron cargar las fotos de este globo desde Drive.');
      } finally {
        setRestoringCollection(false);
      }
    }
  };

  const handleRenameCollection = async (id: string, newName: string) => {
    const col = collections.find((c) => c.id === id);
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name: newName } : c)));
    if (col?.driveFolderId && isSignedIn) {
      try {
        const token = await getDriveAccessToken();
        await renameCollection(token, col.driveFolderId, newName);
      } catch (e) {
        console.error(e);
        setDriveError('No se pudo renombrar el globo en Google Drive.');
      }
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const col = collections.find((c) => c.id === id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    if (activeCollectionId === id) {
      setActiveCollectionId(null);
      setMode('collections');
    }
    if (col) {
      revokeImageUrls(col.photos);
      driveIdsRef.current.delete(id);
    }
    if (col?.driveFolderId && isSignedIn) {
      try {
        const token = await getDriveAccessToken();
        await deleteCollectionFolder(token, col.driveFolderId);
      } catch (e) {
        console.error(e);
        setDriveError('No se pudo eliminar el globo de Google Drive.');
      }
    }
  };

  // --- Photos within the active collection ---

  const handleGalleryImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0 || !activeCollection) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      const urls = await extractImagesFromFiles(imageFiles);
      if (urls.length === 0) {
        setGalleryError('No se encontraron imágenes válidas en los archivos seleccionados.');
      } else {
        addPhotosToActiveCollection(urls);
        syncNewPhotosToDrive(activeCollection.id, activeCollection.driveFolderId, imageFiles.map((f, i) => ({ blob: f, name: f.name, url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudieron leer las imágenes seleccionadas.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleGalleryZipSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeCollection) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const { urls, blobs, names } = await extractImagesFromZip(file);
      if (urls.length === 0) {
        setGalleryError('El ZIP no contiene imágenes reconocibles (jpg, png, webp, gif).');
      } else {
        addPhotosToActiveCollection(urls);
        syncNewPhotosToDrive(activeCollection.id, activeCollection.driveFolderId, blobs.map((blob, i) => ({ blob, name: names[i], url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudo leer el archivo ZIP. Comprueba que no esté dañado.');
    } finally {
      setGalleryLoading(false);
    }
  };

  function addPhotosToActiveCollection(urls: string[]) {
    if (!activeCollectionId) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === activeCollectionId ? { ...c, photos: [...c.photos, ...urls] } : c))
    );
  }

  function syncNewPhotosToDrive(
    collectionId: string,
    driveFolderId: string | undefined,
    items: { blob: Blob; name: string; url: string }[]
  ) {
    if (!isSignedIn || !driveFolderId) return;
    setUploadingCount((c) => c + items.length);
    items.forEach(async ({ blob, name, url }) => {
      try {
        const token = await getDriveAccessToken();
        const uploaded = await uploadPhotoToDrive(token, driveFolderId, blob, name);
        getCollectionDriveIds(collectionId).set(url, uploaded.id);
      } catch (e) {
        console.error('No se pudo subir la foto a Drive:', name, e);
        setDriveError('Algunas fotos no se pudieron guardar en Google Drive (se mostrarán igualmente en este dispositivo).');
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    });
  }

  const removePhotoFromActiveCollection = (index: number) => {
    if (!activeCollection) return;
    const collectionId = activeCollection.id;
    const url = activeCollection.photos[index];
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, photos: c.photos.filter((_, i) => i !== index) } : c))
    );
    if (url) {
      revokeImageUrls([url]);
      const idsMap = driveIdsRef.current.get(collectionId);
      const driveId = idsMap?.get(url);
      if (driveId && isSignedIn) {
        getDriveAccessToken()
          .then((token) => deleteDrivePhoto(token, driveId))
          .catch((e) => console.error('No se pudo borrar la foto de Drive:', e));
      }
      idsMap?.delete(url);
    }
  };

  const startWithActiveCollection = () => {
    if (!activeCollection) return;
    // 'gallery' is a sentinel value (like 'explorer') — there is no single
    // "traveler photo" avatar in this flow, the globe itself is built from
    // the collection's photos.
    onStart('gallery', activeCollection.photos);
  };

  const startRenameActive = () => {
    if (!activeCollection) return;
    setRenameValue(activeCollection.name);
    setRenamingActive(true);
  };

  const confirmRenameActive = () => {
    const trimmed = renameValue.trim();
    if (activeCollection && trimmed) {
      handleRenameCollection(activeCollection.id, trimmed);
    }
    setRenamingActive(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-lg mx-auto p-6 font-sans text-center overflow-y-auto">
      <div className="flex-grow flex-shrink-0 flex flex-col items-center justify-center w-full py-8">

        {/* Title & Subtitle */}
        <div className={`mb-6 ${mode !== 'menu' ? 'hidden md:block' : ''}`}>
          <h1 className="text-[40px] sm:text-[48px] font-bold font-display tracking-tight text-gray-900 leading-none mb-2">
            BolAitor
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">
            3D Globe
          </p>
          <p className="text-sm sm:text-base text-gray-500 lowercase tracking-wide max-w-sm mx-auto">
            galería esférica interactiva en 3d · sube tus propias fotos
          </p>
        </div>

        {/* Signed-in account pill (visible on every screen once logged in via Clerk) */}
        <AccountPill />

        {/* MAIN MENU */}
        {mode === 'menu' && (
          <div className="flex flex-col gap-3.5 w-full max-w-xs">
            {/* Named collections ("globos") */}
            <button
              id="add-gallery-photos-btn"
              onClick={goToCollections}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold rounded-none shadow-sm cursor-pointer"
            >
              <Images className="w-4 h-4" />
              Mis globos
              {collections.length > 0 && (
                <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{collections.length}</span>
              )}
            </button>

            {/* Direct exploration with curated destinations */}
            <button
              id="explore-globe-btn"
              onClick={() => handleStart('explorer')}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-gray-900 text-gray-900 bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs font-medium rounded-none cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Explorar destinos del mundo
            </button>

            {/* Upload avatar photo */}
            <button
              id="upload-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs font-medium rounded-none cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Subir foto de viajero
            </button>

            {/* Click photo */}
            <button
              id="camera-photo-btn"
              onClick={startCamera}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs font-medium rounded-none cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Hacerme un selfie
            </button>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <p className="text-[11px] text-gray-400 mt-4 tracking-wider uppercase font-mono">
              48 Destinos Curados • WebGL 3D
            </p>

            {/* Registro / login centralizado con Clerk (incluye Google) */}
            <SignInPrompt variant="menu" />
            {isSignedIn && !hasGoogleAccount && <ConnectDriveButton />}
            {driveError && <p className="text-[11px] text-red-500 leading-relaxed">{driveError}</p>}
          </div>
        )}

        {/* MY GLOBES: list of named collections */}
        {mode === 'collections' && (
          <CollectionsScreen
            collections={collections}
            loading={collectionsLoading}
            isSignedIn={isSignedIn}
            creating={creatingCollection}
            onOpen={handleOpenCollection}
            onCreate={handleCreateCollection}
            onRename={handleRenameCollection}
            onDelete={handleDeleteCollection}
            onBack={goToMenu}
          />
        )}

        {/* GALLERY: photos inside the active collection */}
        {mode === 'gallery' && activeCollection && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-full text-left">
              <button
                onClick={goToCollections}
                className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-700 cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Mis globos
              </button>

              {renamingActive ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmRenameActive()}
                    className="text-lg font-bold text-gray-900 border-b border-gray-400 focus:outline-none flex-1 min-w-0"
                  />
                  <button onClick={confirmRenameActive} className="text-emerald-600 hover:text-emerald-800 cursor-pointer" aria-label="Guardar">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                  {activeCollection.name}
                  <button onClick={startRenameActive} className="text-gray-300 hover:text-gray-700 cursor-pointer" aria-label="Renombrar globo">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </h2>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                Sube imágenes sueltas o un único archivo <strong>.zip</strong> con varias fotos.
                Se mostrarán como tarjetas en este globo 3D.
              </p>
              {isSignedIn && activeCollection.driveFolderId ? (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-2">
                  <Cloud className="w-3.5 h-3.5" />
                  Se guardan en tu Google Drive {userEmail ? `(${userEmail})` : ''}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
                  <CloudOff className="w-3.5 h-3.5" />
                  Solo en este navegador — inicia sesión para guardarlas en tu Drive
                </p>
              )}
            </div>

            {restoringCollection && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cargando las fotos de este globo desde Google Drive...
              </div>
            )}

            {isSignedIn && !hasGoogleAccount && <ConnectDriveButton />}

            <div className="flex gap-2.5 w-full">
              <button
                onClick={() => imagesInputRef.current?.click()}
                disabled={galleryLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 border border-gray-900 text-gray-900 bg-white hover:bg-gray-50 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-50"
              >
                <Images className="w-4 h-4" />
                Imágenes
              </button>
              <button
                onClick={() => zipInputRef.current?.click()}
                disabled={galleryLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 border border-gray-900 text-gray-900 bg-white hover:bg-gray-50 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-50"
              >
                <FileArchive className="w-4 h-4" />
                Archivo ZIP
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              ref={imagesInputRef}
              onChange={handleGalleryImagesSelected}
            />
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              ref={zipInputRef}
              onChange={handleGalleryZipSelected}
            />

            {galleryLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Procesando imágenes...
              </div>
            )}
            {uploadingCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Guardando {uploadingCount} foto{uploadingCount === 1 ? '' : 's'} en Google Drive...
              </div>
            )}

            {galleryError && (
              <p className="text-xs text-red-500 leading-relaxed">{galleryError}</p>
            )}
            {driveError && (
              <p className="text-xs text-amber-600 leading-relaxed">{driveError}</p>
            )}

            {activeCollection.photos.length > 0 && (
              <>
                <div className="w-full grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                  {activeCollection.photos.map((url, i) => (
                    <div key={url + i} className="relative aspect-square group">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover border border-gray-200" />
                      <button
                        onClick={() => removePhotoFromActiveCollection(i)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Quitar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                  {activeCollection.photos.length} foto{activeCollection.photos.length === 1 ? '' : 's'} cargada{activeCollection.photos.length === 1 ? '' : 's'}
                </p>
              </>
            )}

            <button
              id="start-with-gallery-btn"
              onClick={startWithActiveCollection}
              disabled={activeCollection.photos.length === 0}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              Ver este globo
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="w-full border-t border-gray-100 pt-3 mt-1">
              <ShareControl folderId={activeCollection.driveFolderId} isSignedIn={isSignedIn} />
            </div>

            {!isSignedIn && driveConfigured && <SignInPrompt variant="inline" />}
          </div>
        )}

        {/* Webcam Capture Mode */}
        {mode === 'camera' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="relative w-full aspect-[3/4] max-h-[48vh] bg-gray-100 border border-gray-900 overflow-hidden">
              <video ref={videoRef} className="object-cover w-full h-full" playsInline muted />
            </div>
            <button
              onClick={takePhoto}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-medium cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capturar foto
            </button>
            <button
              onClick={goToMenu}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Photo Preview Mode (avatar / selfie) */}
        {mode === 'preview' && previewUrl && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <div className="w-44 aspect-[3/4] border border-gray-900 overflow-hidden bg-gray-100 shadow-md">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <button
              id="confirm-start-btn"
              onClick={() => handleStart(previewUrl)}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold cursor-pointer"
            >
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={goToMenu}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Elegir otra foto
            </button>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
