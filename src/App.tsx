import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import IntroScreen from './components/IntroScreen';
import LocationDetailsScreen from './components/LocationDetailsScreen';
import LoadingOverlay from './components/LoadingOverlay';
import SharedGlobeViewer from './components/SharedGlobeViewer';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import ThemeToggle from './components/ThemeToggle';
import type { CollectionPhoto } from './types/collection';

// GalleryGlobe (and therefore three.js / @react-three/fiber / @react-three/drei)
// is only ever needed once the user has chosen a photo collection to
// explore — loading it lazily keeps those heavy libraries out of the
// initial bundle that renders the menu.
const GalleryGlobe = lazy(() => import('./components/GalleryGlobe'));

const SHARE_PATH_MATCH = typeof window !== 'undefined' ? window.location.pathname.match(/^\/share\/([A-Za-z0-9_-]+)\/?$/) : null;
const IS_PRIVACY_PAGE = typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/privacidad';
const IS_TERMS_PAGE = typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/terminos';

export default function App() {
  const [customPhotos, setCustomPhotos] = useState<CollectionPhoto[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ image: string; location: string; info: string } | null>(null);
  const [isLoadingGlobe, setIsLoadingGlobe] = useState(false);

  // Static legal pages: no login, no globe, no Drive context needed.
  if (IS_PRIVACY_PAGE) return <PrivacyPolicyPage />;
  if (IS_TERMS_PAGE) return <TermsOfServicePage />;

  // Public, read-only shared globe: /share/<token> — no login, no menu.
  if (SHARE_PATH_MATCH) {
    return (
      <div className="w-full h-full relative bg-white dark:bg-gray-950 overflow-hidden select-none">
        <SharedGlobeViewer token={SHARE_PATH_MATCH[1]} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-white dark:bg-gray-950 overflow-hidden select-none">
      {!customPhotos ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-950 z-50">
          <IntroScreen onStart={(photos) => {
            setCustomPhotos(photos);
            setIsLoadingGlobe(true);
          }} />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {isLoadingGlobe && (
              <motion.div
                key="loading-overlay"
                className="absolute inset-0 z-40 bg-white dark:bg-gray-950"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <LoadingOverlay onComplete={() => setIsLoadingGlobe(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            initial={{ scale: 1, opacity: 0 }}
            animate={
              isLoadingGlobe 
                ? { scale: 1, opacity: 0 } 
                : { scale: selectedCard ? 0.85 : 1, opacity: selectedCard ? 0.25 : 1 }
            }
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 ${selectedCard ? 'pointer-events-none' : ''}`}
          >
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-950">
                  <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-mono uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando el globo…
                  </div>
                </div>
              }
            >
              <GalleryGlobe 
                customPhotos={customPhotos}
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

          {/* Navigation Controls & Hint */}
          {!isLoadingGlobe && !selectedCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute bottom-6 left-0 right-0 flex flex-col sm:flex-row items-center justify-between px-8 z-30 pointer-events-none gap-2"
            >
              <div className="text-[11px] text-gray-400 dark:text-gray-500 font-mono tracking-wider">
                DRAG TO ROTATE • SCROLL TO PENETRATE • CLICK TO EXPLORE
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button 
                  onClick={() => setCustomPhotos(null)}
                  className="text-[11px] font-mono tracking-widest uppercase text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 shadow-sm transition-all rounded-none cursor-pointer"
                >
                  Cambiar fotos
                </button>
                <ThemeToggle />
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
