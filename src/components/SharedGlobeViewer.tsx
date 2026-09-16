import { lazy, Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Globe2 } from 'lucide-react';
import LocationDetailsScreen from './LocationDetailsScreen';
import { DEFAULT_PHOTO_DESCRIPTION, titleFromFilename } from '../utils/photoCaption';
import type { CollectionPhoto } from '../types/collection';

// Lazily loaded so an anonymous visitor's first paint isn't blocked on
// three.js / @react-three/fiber / @react-three/drei.
const GalleryGlobe = lazy(() => import('./GalleryGlobe'));

interface SharedGlobeViewerProps {
  token: string;
}

interface SharedPhotoMeta {
  id: string;
  name: string;
  description?: string;
}

type Status = 'loading' | 'ready' | 'error';

export default function SharedGlobeViewer({ token }: SharedGlobeViewerProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [photos, setPhotos] = useState<CollectionPhoto[]>([]);
  const [selectedCard, setSelectedCard] = useState<{ image: string; location: string; info: string } | null>(null);

  useEffect(() => {
    // Start downloading the globe's code in parallel with the metadata
    // fetch below, instead of only after the metadata resolves.
    import('./GalleryGlobe');

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${token}/meta`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar este globo compartido.');
        }
        if (cancelled) return;
        const sharedPhotos: SharedPhotoMeta[] = data.photos || [];
        setCollectionName(data.name || 'Globo compartido');
        setPhotos(
          sharedPhotos.map((p, i) => ({
            url: `/api/share/${token}/photo/${p.id}`,
            title: titleFromFilename(p.name, `Foto ${i + 1}`),
            description: p.description || DEFAULT_PHOTO_DESCRIPTION,
          }))
        );
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setErrorMessage(e instanceof Error ? e.message : 'No se pudo cargar este globo compartido.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-mono uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando globo compartido…
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white p-6 text-center">
        <div className="max-w-xs">
          <Globe2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold mb-1">No se pudo cargar este globo</p>
          <p className="text-sm text-gray-500">{errorMessage}</p>
          <a href="/" className="inline-block mt-5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900">
            Ir a BolAitor 3D Globe
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-white overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ scale: selectedCard ? 0.85 : 1, opacity: selectedCard ? 0.25 : 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute inset-0 ${selectedCard ? 'pointer-events-none' : ''}`}
      >
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-white">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-mono uppercase tracking-widest">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando el globo…
              </div>
            </div>
          }
        >
          <GalleryGlobe
            customPhotos={photos}
            onSelect={(img, loc, info) => setSelectedCard({ image: img, location: loc, info })}
          />
        </Suspense>
      </motion.div>

      <AnimatePresence>
        {selectedCard && (
          <LocationDetailsScreen
            key="location-details"
            data={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </AnimatePresence>

      {!selectedCard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col sm:flex-row items-center justify-between px-8 z-30 pointer-events-none gap-2"
        >
          <div className="text-[11px] text-gray-400 font-mono tracking-wider">
            DRAG TO ROTATE • SCROLL TO PENETRATE • CLICK TO EXPLORE
          </div>
          <a
            href="/"
            className="pointer-events-auto text-[11px] font-mono tracking-widest uppercase text-gray-500 hover:text-black bg-white/80 hover:bg-white backdrop-blur-sm px-3.5 py-1.5 border border-gray-200 shadow-sm transition-all"
          >
            "{collectionName}" · Crea el tuyo en BolAitor 3D Globe
          </a>
        </motion.div>
      )}
    </div>
  );
}
