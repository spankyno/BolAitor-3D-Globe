import { useState, useMemo } from 'react';
import { X, MapPin, Calendar, Globe as GlobeIcon, Volume2, VolumeX, Check, Copy, User } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import { LOCATIONS_LIST } from '../locationsData';

interface LocationDetailsProps {
  data: { image: string; location: string; info: string };
  userPhoto?: string | null;
  onClose: () => void;
}

export default function LocationDetailsScreen({ data, userPhoto, onClose }: LocationDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Match details from list
  const locMeta = useMemo(() => {
    return LOCATIONS_LIST.find(l => l.name.toLowerCase() === data.location.toLowerCase()) || {
      name: data.location,
      country: data.location.split(',')[1]?.trim() || '',
      flag: '📍',
      region: 'World',
      coordinates: 'Coordinates available',
      bestTime: 'Year-round'
    };
  }, [data.location]);

  const handleCopy = () => {
    const textToCopy = `${data.location}\n\n${data.info}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.info);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-8 md:p-12 bg-black/40 backdrop-blur-sm"
    >
      {/* Background click listener */}
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row w-full max-w-5xl max-h-[85vh] relative z-10 overflow-hidden rounded-xl border border-gray-100"
      >
        {/* Close Button */}
        <button 
          id="close-location-details"
          onClick={onClose} 
          className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors z-20 shadow-md border border-gray-200/80 rounded-full flex items-center justify-center"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Visual & Landmark Info */}
        <div className="w-full md:w-[45%] h-64 md:h-auto bg-gray-950 flex-shrink-0 relative overflow-hidden group">
          <img 
            src={data.image} 
            alt={data.location} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{locMeta.flag}</span>
              <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {locMeta.region}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display">{data.location}</h2>
            {locMeta.coordinates && (
              <p className="text-xs text-gray-300 font-mono mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {locMeta.coordinates}
              </p>
            )}
          </div>

          {/* User photo companion tag if present */}
          {userPhoto && userPhoto !== 'explorer' && userPhoto !== 'gallery' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/50">
              <img 
                src={userPhoto} 
                alt="Traveler" 
                className="w-6 h-6 rounded-full object-cover border border-gray-300" 
              />
              <span className="text-[11px] font-medium text-gray-800 tracking-wide">
                Your destination
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Historical / Cultural Content */}
        <div className="w-full h-full md:w-[55%] flex flex-col p-6 sm:p-8 md:p-10 overflow-y-auto bg-white">
          {/* Header Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            {locMeta.bestTime && (
              <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Best: {locMeta.bestTime}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
              <GlobeIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>{locMeta.country || 'Global Landmark'}</span>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {'speechSynthesis' in window && (
                <button
                  onClick={toggleSpeech}
                  className={`p-2 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                    isSpeaking 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                  title={isSpeaking ? "Stop narration" : "Listen to description"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-2 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1 transition-colors"
                title="Copy location info"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="text-gray-700 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-display">
              {data.location}
            </h1>
            
            <div className="prose prose-neutral max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
              <Markdown>{data.info}</Markdown>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>BolAitor 3D Globe Collection</span>
            <span>48 World Landmarks</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
