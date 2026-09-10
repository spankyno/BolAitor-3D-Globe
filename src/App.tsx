import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GalleryGlobe from './components/GalleryGlobe';
import IntroScreen from './components/IntroScreen';
import LocationDetailsScreen from './components/LocationDetailsScreen';
import LoadingOverlay from './components/LoadingOverlay';

export default function App() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ image: string; location: string; info: string } | null>(null);
  const [isLoadingGlobe, setIsLoadingGlobe] = useState(false);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden select-none">
      {!userPhoto ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <IntroScreen onStart={(photo) => {
            setUserPhoto(photo);
            setIsLoadingGlobe(true);
          }} />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {isLoadingGlobe && (
              <motion.div
                key="loading-overlay"
                className="absolute inset-0 z-40 bg-white"
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
            <GalleryGlobe 
              userPhoto={userPhoto} 
              onSelect={(img, loc, info) => setSelectedCard({ image: img, location: loc, info })} 
            />
          </motion.div>

          <AnimatePresence>
            {selectedCard && (
              <LocationDetailsScreen 
                key="location-details"
                data={selectedCard}
                userPhoto={userPhoto}
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
              <div className="text-[11px] text-gray-400 font-mono tracking-wider">
                DRAG TO ROTATE • SCROLL TO PENETRATE • CLICK TO EXPLORE
              </div>

              <div className="flex items-center gap-4 pointer-events-auto">
                <button 
                  onClick={() => setUserPhoto(null)}
                  className="text-[11px] font-mono tracking-widest uppercase text-gray-500 hover:text-black bg-white/80 hover:bg-white backdrop-blur-sm px-3.5 py-1.5 border border-gray-200 shadow-sm transition-all rounded-none cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
