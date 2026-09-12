import { Camera, Upload, ArrowRight, Compass, Images, FileArchive, X, Loader2, Cloud, CloudOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { extractImagesFromFiles, extractImagesFromZip, revokeImageUrls } from '../utils/customPhotos';
import { deleteDrivePhoto, ensureAppFolder, listDrivePhotos, uploadPhotoToDrive } from '../utils/googleDrive';
import { useDriveAuth } from '../context/DriveAuthContext';
import { AccountPill, ConnectDriveButton, SignInPrompt } from './ClerkAuth';

interface IntroScreenProps {
  onStart: (photoBase64: string, customPhotos?: string[]) => void;
}

type Mode = 'menu' | 'gallery' | 'camera' | 'preview';

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

  // Custom gallery photos state (the "photos for the globe" feature)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  // Maps an object URL -> its Google Drive file id, for photos that are
  // synced to Drive (so we know what to delete there too).
  const driveIdsRef = useRef<Map<string, string>>(new Map());

  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [restoringFromDrive, setRestoringFromDrive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [driveError, setDriveError] = useState<string | null>(null);
  const restoredForSession = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Once signed in (via Clerk), set up the Drive folder and restore any
  // photos previously saved there.
  useEffect(() => {
    if (!isSignedIn || restoredForSession.current) return;
    restoredForSession.current = true;
    setDriveError(null);
    setRestoringFromDrive(true);
    (async () => {
      try {
        const token = await getDriveAccessToken();
        const folderId = await ensureAppFolder(token);
        setDriveFolderId(folderId);
        const drivePhotos = await listDrivePhotos(token, folderId);
        if (drivePhotos.length > 0) {
          drivePhotos.forEach((p) => driveIdsRef.current.set(p.url, p.id));
          setGalleryPhotos((prev) => [...prev, ...drivePhotos.map((p) => p.url)]);
          setMode('gallery');
        }
      } catch (e) {
        console.error(e);
        setDriveError(
          e instanceof Error
            ? e.message
            : 'Sesión iniciada, pero no se pudieron cargar tus fotos guardadas en Drive.'
        );
      } finally {
        setRestoringFromDrive(false);
      }
    })();
  }, [isSignedIn, getDriveAccessToken]);

  // If the user signs out, allow a future sign-in to restore again.
  useEffect(() => {
    if (!isSignedIn) {
      restoredForSession.current = false;
      setDriveFolderId(null);
    }
  }, [isSignedIn]);

  const resetGallery = () => {
    revokeImageUrls(galleryPhotos);
    driveIdsRef.current.clear();
    setGalleryPhotos([]);
    setGalleryError(null);
  };

  const goToMenu = () => {
    stopCamera();
    setPreviewUrl(null);
    setMode('menu');
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

  // --- Gallery photos: add via individual images ---
  const handleGalleryImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      const urls = await extractImagesFromFiles(imageFiles);
      if (urls.length === 0) {
        setGalleryError('No se encontraron imágenes válidas en los archivos seleccionados.');
      } else {
        setGalleryPhotos((prev) => [...prev, ...urls]);
        syncNewPhotosToDrive(imageFiles.map((f, i) => ({ blob: f, name: f.name, url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudieron leer las imágenes seleccionadas.');
    } finally {
      setGalleryLoading(false);
    }
  };

  // --- Gallery photos: add via a .zip file ---
  const handleGalleryZipSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const { urls, blobs, names } = await extractImagesFromZip(file);
      if (urls.length === 0) {
        setGalleryError('El ZIP no contiene imágenes reconocibles (jpg, png, webp, gif).');
      } else {
        setGalleryPhotos((prev) => [...prev, ...urls]);
        syncNewPhotosToDrive(blobs.map((blob, i) => ({ blob, name: names[i], url: urls[i] })));
      }
    } catch (err) {
      console.error(err);
      setGalleryError('No se pudo leer el archivo ZIP. Comprueba que no esté dañado.');
    } finally {
      setGalleryLoading(false);
    }
  };

  // Uploads newly added photos to the user's Google Drive in the
  // background, if they're signed in. Local preview already works
  // regardless of whether this succeeds.
  function syncNewPhotosToDrive(items: { blob: Blob; name: string; url: string }[]) {
    if (!isSignedIn || !driveFolderId) return;
    setUploadingCount((c) => c + items.length);
    items.forEach(async ({ blob, name, url }) => {
      try {
        const token = await getDriveAccessToken();
        const uploaded = await uploadPhotoToDrive(token, driveFolderId, blob, name);
        driveIdsRef.current.set(url, uploaded.id);
      } catch (e) {
        console.error('No se pudo subir la foto a Drive:', name, e);
        setDriveError('Algunas fotos no se pudieron guardar en Google Drive (se mostrarán igualmente en este dispositivo).');
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    });
  }

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos((prev) => {
      const removed = prev[index];
      if (removed) {
        revokeImageUrls([removed]);
        const driveId = driveIdsRef.current.get(removed);
        if (driveId && isSignedIn) {
          getDriveAccessToken()
            .then((token) => deleteDrivePhoto(token, driveId))
            .catch((e) => console.error('No se pudo borrar la foto de Drive:', e));
        }
        driveIdsRef.current.delete(removed);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const startWithGalleryPhotos = () => {
    // 'gallery' is a sentinel value (like 'explorer') — there is no single
    // "traveler photo" avatar in this flow, the globe itself is built from
    // the uploaded photos.
    onStart('gallery', galleryPhotos);
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
            {/* Add own photos to the globe (zip or individual images) */}
            <button
              id="add-gallery-photos-btn"
              onClick={() => setMode('gallery')}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold rounded-none shadow-sm cursor-pointer"
            >
              <Images className="w-4 h-4" />
              Añadir mis fotos al globo
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

        {/* GALLERY UPLOAD: zip or individual images for the globe */}
        {mode === 'gallery' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="w-full text-left">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Fotos para tu globo</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sube imágenes sueltas o un único archivo <strong>.zip</strong> con varias fotos.
                Se mostrarán como tarjetas en el globo 3D.
              </p>
              {isSignedIn ? (
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

            {restoringFromDrive && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Cargando tus fotos guardadas en Google Drive...
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

            {galleryPhotos.length > 0 && (
              <>
                <div className="w-full grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                  {galleryPhotos.map((url, i) => (
                    <div key={url + i} className="relative aspect-square group">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover border border-gray-200" />
                      <button
                        onClick={() => removeGalleryPhoto(i)}
                        className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label="Quitar foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">
                  {galleryPhotos.length} foto{galleryPhotos.length === 1 ? '' : 's'} cargada{galleryPhotos.length === 1 ? '' : 's'}
                </p>
              </>
            )}

            <button
              id="start-with-gallery-btn"
              onClick={startWithGalleryPhotos}
              disabled={galleryPhotos.length === 0}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              Ver mi globo
              <ArrowRight className="w-4 h-4" />
            </button>

            {!isSignedIn && driveConfigured && <SignInPrompt variant="inline" />}

            <button
              onClick={() => {
                if (galleryPhotos.length > 0 && !window.confirm('¿Quitar todas las fotos cargadas de esta pantalla?')) {
                  return;
                }
                resetGallery();
                goToMenu();
              }}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Volver al menú
            </button>
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
