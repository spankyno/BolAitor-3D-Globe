import { ArrowRight, Images, FileArchive, X, Loader2, Cloud, CloudOff, ArrowLeft, Pencil, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { extractImagesFromFiles, extractImagesFromZip, revokeImageUrls } from '../utils/customPhotos';
import { mapWithConcurrency } from '../utils/concurrency';
import { DEFAULT_PHOTO_DESCRIPTION, titleFromFilename } from '../utils/photoCaption';
import {
  countPhotosInFolder,
  createCollection,
  deleteCollectionFolder,
  deleteDrivePhoto,
  ensureAppFolder,
  listCollections,
  listDrivePhotos,
  renameCollection,
  updatePhotoMetadata,
  uploadPhotoToDrive,
} from '../utils/googleDrive';
import { useDriveAuth } from '../context/DriveAuthContext';
import { AccountPill, ConnectDriveButton, SignInPrompt } from './ClerkAuth';
import CollectionsScreen from './CollectionsScreen';
import ShareControl from './ShareControl';
import SiteFooter from './SiteFooter';
import PhotoCaptionEditor from './PhotoCaptionEditor';
import ThemeToggle from './ThemeToggle';
import Skeleton from './Skeleton';
import { makeLocalCollectionId, type Collection, type CollectionPhoto } from '../types/collection';

interface IntroScreenProps {
  onStart: (customPhotos: CollectionPhoto[]) => void;
}

type Mode = 'menu' | 'collections' | 'gallery';

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [mode, setMode] = useState<Mode>('menu');

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

  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [driveError, setDriveError] = useState<string | null>(null);

  const [renamingActive, setRenamingActive] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const imagesInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const activeCollection = collections.find((c) => c.id === activeCollectionId) || null;

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
        // Run the subfolder counts and the root's own loose-photo count at
        // the same time, instead of one after another.
        const [loaded, looseCount] = await Promise.all([
          mapWithConcurrency(subfolders, 6, async (sf) => {
            const count = await countPhotosInFolder(token, sf.id);
            return { id: sf.id, name: sf.name, photos: [], photosLoaded: false, driveFolderId: sf.id, photoCount: count } as Collection;
          }),
          countPhotosInFolder(token, rootId),
        ]);
        // Backwards-compatibility: photos uploaded before "collections"
        // existed sit loose in the root folder — surface them as a
        // collection too, so nothing gets orphaned.
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
    setMode('menu');
  };

  const goToCollections = () => {
    setEditingPhotoIndex(null);
    setMode('collections');
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
        const drivePhotos = await listDrivePhotos(token, col.driveFolderId);
        const photos: CollectionPhoto[] = drivePhotos.map((p, i) => ({
          url: p.url,
          title: titleFromFilename(p.name, `Foto ${i + 1}`),
          description: p.description || DEFAULT_PHOTO_DESCRIPTION,
          driveId: p.id,
        }));
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, photos, photosLoaded: true } : c))
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
      revokeImageUrls(col.photos.map((p) => p.url));
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

  const processImageFiles = async (files: File[]) => {
    if (files.length === 0 || !activeCollection) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const { urls, blobs, names } = await extractImagesFromFiles(files);
      if (urls.length === 0) {
        setGalleryError('No se encontraron imágenes válidas en los archivos seleccionados.');
      } else {
        const baseIndex = activeCollection.photos.length;
        const newPhotos: CollectionPhoto[] = urls.map((url, i) => ({
          url,
          title: titleFromFilename(names[i], `Foto ${baseIndex + i + 1}`),
          description: DEFAULT_PHOTO_DESCRIPTION,
        }));
        addPhotosToActiveCollection(newPhotos);
        syncNewPhotosToDrive(activeCollection.id, activeCollection.driveFolderId, blobs.map((blob, i) => ({ blob, name: names[i], url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudieron leer las imágenes seleccionadas.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const processZipFile = async (file: File) => {
    if (!activeCollection) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const { urls, blobs, names } = await extractImagesFromZip(file);
      if (urls.length === 0) {
        setGalleryError('El ZIP no contiene imágenes reconocibles (jpg, png, webp, gif).');
      } else {
        const baseIndex = activeCollection.photos.length;
        const newPhotos: CollectionPhoto[] = urls.map((url, i) => ({
          url,
          title: titleFromFilename(names[i], `Foto ${baseIndex + i + 1}`),
          description: DEFAULT_PHOTO_DESCRIPTION,
        }));
        addPhotosToActiveCollection(newPhotos);
        syncNewPhotosToDrive(activeCollection.id, activeCollection.driveFolderId, blobs.map((blob, i) => ({ blob, name: names[i], url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudo leer el archivo ZIP. Comprueba que no esté dañado.');
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleGalleryImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await processImageFiles(files);
  };

  const handleGalleryZipSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await processZipFile(file);
  };

  const isZipFile = (file: File) =>
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounter.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
    if (!activeCollection) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    if (files.length === 1 && isZipFile(files[0])) {
      await processZipFile(files[0]);
    } else {
      const imageFiles = files.filter((f) => f.type.startsWith('image/') || !isZipFile(f));
      await processImageFiles(imageFiles);
    }
  };

  function addPhotosToActiveCollection(newPhotos: CollectionPhoto[]) {
    if (!activeCollectionId) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === activeCollectionId ? { ...c, photos: [...c.photos, ...newPhotos] } : c))
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
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, photos: c.photos.map((p) => (p.url === url ? { ...p, driveId: uploaded.id } : p)) }
              : c
          )
        );
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
    const photo = activeCollection.photos[index];
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, photos: c.photos.filter((_, i) => i !== index) } : c))
    );
    if (photo) {
      revokeImageUrls([photo.url]);
      if (photo.driveId && isSignedIn) {
        getDriveAccessToken()
          .then((token) => deleteDrivePhoto(token, photo.driveId!))
          .catch((e) => console.error('No se pudo borrar la foto de Drive:', e));
      }
    }
  };

  const handleSaveCaption = (index: number, title: string, description: string) => {
    if (!activeCollection) return;
    const collectionId = activeCollection.id;
    const photo = activeCollection.photos[index];
    setCollections((prev) =>
      prev.map((c) =>
        c.id === collectionId
          ? { ...c, photos: c.photos.map((p, i) => (i === index ? { ...p, title, description } : p)) }
          : c
      )
    );
    if (photo?.driveId && isSignedIn) {
      getDriveAccessToken()
        .then((token) => updatePhotoMetadata(token, photo.driveId!, { name: title, description }))
        .catch((e) => {
          console.error('No se pudo guardar el título/descripción en Drive:', e);
          setDriveError('No se pudo guardar el título/descripción en Google Drive (se mantiene en este dispositivo).');
        });
    }
  };

  const startWithActiveCollection = () => {
    if (!activeCollection) return;
    onStart(activeCollection.photos);
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
      <ThemeToggle className="fixed top-4 right-4 z-30" />

      <div className="flex-grow flex-shrink-0 flex flex-col items-center justify-center w-full py-8">

        {/* Title & Subtitle */}
        <div className={`mb-6 ${mode !== 'menu' ? 'hidden md:block' : ''}`}>
          <h1 className="text-[40px] sm:text-[48px] font-bold font-display tracking-tight text-gray-900 dark:text-gray-50 leading-none mb-2">
            BolAitor
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500 mb-3">
            3D Globe
          </p>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 lowercase tracking-wide max-w-sm mx-auto">
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
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 dark:border-gray-100 text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white transition-colors uppercase tracking-widest text-xs font-semibold rounded-none shadow-sm cursor-pointer"
            >
              <Images className="w-4 h-4" />
              Mis globos
              {collections.length > 0 && (
                <span className="ml-1 text-[10px] bg-white/20 dark:bg-gray-900/10 px-1.5 py-0.5 rounded-full">{collections.length}</span>
              )}
            </button>

            {/* Info footer */}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 tracking-wider uppercase font-mono">
              WebGL 3D
            </p>

            {/* Registro / login centralizado con Clerk (incluye Google) */}
            <SignInPrompt variant="menu" />
            {isSignedIn && !hasGoogleAccount && <ConnectDriveButton />}
            {driveError && <p className="text-[11px] text-red-500 dark:text-red-400 leading-relaxed">{driveError}</p>}
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
                className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer mb-2"
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
                    className="text-lg font-bold text-gray-900 dark:text-gray-50 bg-transparent border-b border-gray-400 dark:border-gray-600 focus:outline-none flex-1 min-w-0"
                  />
                  <button onClick={confirmRenameActive} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer" aria-label="Guardar">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-1 flex items-center gap-2">
                  {activeCollection.name}
                  <button onClick={startRenameActive} className="text-gray-300 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" aria-label="Renombrar globo">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </h2>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Sube imágenes sueltas o un único archivo <strong>.zip</strong> con varias fotos, o arrástralas aquí abajo.
                Se mostrarán como tarjetas en este globo 3D.
              </p>
              {isSignedIn && activeCollection.driveFolderId ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-2">
                  <Cloud className="w-3.5 h-3.5" />
                  Se guardan en tu Google Drive {userEmail ? `(${userEmail})` : ''}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-2">
                  <CloudOff className="w-3.5 h-3.5" />
                  Solo en este navegador — inicia sesión para guardarlas en tu Drive
                </p>
              )}
            </div>

            {restoringCollection && (
              <div className="w-full grid grid-cols-4 gap-2 p-1" aria-label="Cargando fotos">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            )}

            {isSignedIn && !hasGoogleAccount && <ConnectDriveButton />}

            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropFiles}
              className={`w-full flex flex-col gap-2.5 p-3 border-2 border-dashed rounded-lg transition-colors ${
                isDraggingOver
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => imagesInputRef.current?.click()}
                  disabled={galleryLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3 border border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-50"
                >
                  <Images className="w-4 h-4" />
                  Imágenes
                </button>
                <button
                  onClick={() => zipInputRef.current?.click()}
                  disabled={galleryLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3 border border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-50"
                >
                  <FileArchive className="w-4 h-4" />
                  Archivo ZIP
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 font-mono">
                {isDraggingOver ? 'Suelta para subir' : 'o arrastra tus fotos / un .zip aquí'}
              </p>
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
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Procesando imágenes...
              </div>
            )}
            {uploadingCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Guardando {uploadingCount} foto{uploadingCount === 1 ? '' : 's'} en Google Drive...
              </div>
            )}

            {galleryError && (
              <p className="text-xs text-red-500 dark:text-red-400 leading-relaxed">{galleryError}</p>
            )}
            {driveError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">{driveError}</p>
            )}

            {activeCollection.photos.length > 0 && (
              <>
                <div className="w-full grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                  {activeCollection.photos.map((photo, i) => (
                    <div key={photo.url + i} className="relative aspect-square group">
                      <img src={photo.url} alt={photo.title} loading="lazy" className="w-full h-full object-cover border border-gray-200 dark:border-gray-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={() => setEditingPhotoIndex(i)}
                        className="absolute bottom-1 left-1 bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Editar título y descripción"
                        title="Editar título y descripción"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => removePhotoFromActiveCollection(i)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Quitar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">
                  {activeCollection.photos.length} foto{activeCollection.photos.length === 1 ? '' : 's'} cargada{activeCollection.photos.length === 1 ? '' : 's'}
                </p>
              </>
            )}

            <button
              id="start-with-gallery-btn"
              onClick={startWithActiveCollection}
              disabled={activeCollection.photos.length === 0}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 dark:border-gray-100 text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white transition-colors uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              Ver este globo
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="w-full border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
              <ShareControl folderId={activeCollection.driveFolderId} isSignedIn={isSignedIn} />
            </div>

            {!isSignedIn && driveConfigured && <SignInPrompt variant="inline" />}
          </div>
        )}

      </div>

      {editingPhotoIndex !== null && activeCollection?.photos[editingPhotoIndex] && (
        <PhotoCaptionEditor
          photoUrl={activeCollection.photos[editingPhotoIndex].url}
          initialTitle={activeCollection.photos[editingPhotoIndex].title}
          initialDescription={activeCollection.photos[editingPhotoIndex].description}
          onSave={(title, description) => handleSaveCaption(editingPhotoIndex, title, description)}
          onClose={() => setEditingPhotoIndex(null)}
        />
      )}

      <SiteFooter />

    </div>
  );
}
