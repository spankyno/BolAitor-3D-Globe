import { Camera, Upload, ArrowRight, Compass } from 'lucide-react';
import { useRef, useState } from 'react';

interface IntroScreenProps {
  onStart: (photoBase64: string) => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useCamera, setUseCamera] = useState(false);

  const handleStart = (url: string) => {
    onStart(url);
  };

  const startCamera = async () => {
    try {
      setUseCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera access denied or unavailable", e);
      setUseCamera(false);
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
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setUseCamera(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-lg mx-auto p-6 font-sans text-center overflow-y-auto">
      <div className="flex-grow flex-shrink-0 flex flex-col items-center justify-center w-full py-8">
        
        {/* Title & Subtitle */}
        <div className={`mb-8 ${useCamera ? 'hidden' : previewUrl ? 'hidden md:block' : ''}`}>
          <h1 className="text-[54px] sm:text-[64px] font-bold font-display tracking-tight text-gray-900 leading-none mb-3">
            anywhere
          </h1>
          <p className="text-sm sm:text-base text-gray-500 lowercase tracking-wide max-w-sm mx-auto">
            interactive 3d spherical gallery of iconic world destinations
          </p>
        </div>
        
        {!previewUrl && !useCamera && (
          <div className="flex flex-col gap-3.5 w-full max-w-xs">
            {/* Direct exploration */}
            <button 
              id="explore-globe-btn"
              onClick={() => handleStart('explorer')}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-semibold rounded-none shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Explore the globe
            </button>

            {/* Upload photo */}
            <button 
              id="upload-photo-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-gray-900 text-gray-900 bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs font-medium rounded-none cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload traveler photo
            </button>

            {/* Click photo */}
            <button 
              id="camera-photo-btn"
              onClick={startCamera}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-6 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs font-medium rounded-none cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Take a selfie
            </button>

            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />

            <p className="text-[11px] text-gray-400 mt-4 tracking-wider uppercase font-mono">
              48 Curated Destinations • WebGL 3D
            </p>
          </div>
        )}

        {/* Webcam Capture Mode */}
        {useCamera && !previewUrl && (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="relative w-full aspect-[3/4] max-h-[48vh] bg-gray-100 border border-gray-900 overflow-hidden">
              <video ref={videoRef} className="object-cover w-full h-full" playsInline muted />
            </div>
            <button 
              onClick={takePhoto}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 border border-gray-900 text-white bg-gray-900 hover:bg-black transition-colors uppercase tracking-widest text-xs font-medium cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Capture Photo
            </button>
            <button 
              onClick={stopCamera}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Photo Preview Mode */}
        {previewUrl && (
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
              onClick={() => setPreviewUrl(null)}
              className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              Choose another photo
            </button>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
