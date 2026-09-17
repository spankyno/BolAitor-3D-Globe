import { useState } from 'react';
import { X, Volume2, VolumeX, Check, Copy, Download } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

interface LocationDetailsProps {
  data: { image: string; location: string; info: string };
  onClose: () => void;
}

export default function LocationDetailsScreen({ data, onClose }: LocationDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${data.location}\n\n${data.info}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const safeName = (data.location || 'foto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.href = data.image;
    link.download = `${safeName || 'foto'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        className="bg-white dark:bg-gray-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row w-full max-w-5xl max-h-[85vh] relative z-10 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800"
      >
        {/* Close Button */}
        <button 
          id="close-location-details"
          onClick={onClose} 
          className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors z-20 shadow-md border border-gray-200/80 dark:border-gray-700/80 rounded-full flex items-center justify-center"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Photo */}
        <div className="w-full md:w-[45%] h-64 md:h-auto bg-gray-950 flex-shrink-0 relative overflow-hidden group">
          <img 
            src={data.image} 
            alt={data.location} 
            className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white pointer-events-none">
            <h2 className="text-2xl font-bold tracking-tight font-display">{data.location}</h2>
          </div>
          <button
            onClick={handleDownload}
            className="absolute bottom-4 right-4 p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors z-20 shadow-md border border-gray-200/80 dark:border-gray-700/80 rounded-full flex items-center justify-center cursor-pointer"
            aria-label="Descargar foto"
            title="Descargar foto"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Content */}
        <div className="w-full h-full md:w-[55%] flex flex-col p-6 sm:p-8 md:p-10 overflow-y-auto bg-white dark:bg-gray-900">
          {/* Header actions */}
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="ml-auto flex items-center gap-1.5">
              {'speechSynthesis' in window && (
                <button
                  onClick={toggleSpeech}
                  className={`p-2 rounded-md border text-xs flex items-center gap-1 transition-colors ${
                    isSpeaking 
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                      : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  title={isSpeaking ? "Stop narration" : "Listen to description"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs flex items-center gap-1 transition-colors"
                title="Copy location info"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed space-y-4 font-sans">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-display">
              {data.location}
            </h1>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed space-y-3">
              <Markdown>{data.info}</Markdown>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>BolAitor 3D Globe</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
