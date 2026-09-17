import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface PhotoCaptionEditorProps {
  photoUrl: string;
  initialTitle: string;
  initialDescription: string;
  onSave: (title: string, description: string) => void;
  onClose: () => void;
}

export default function PhotoCaptionEditor({
  photoUrl,
  initialTitle,
  initialDescription,
  onSave,
  onClose,
}: PhotoCaptionEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  const handleSave = () => {
    onSave(title.trim() || initialTitle, description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 w-full max-w-sm shadow-2xl rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full h-40 bg-gray-100 dark:bg-gray-800">
          <img src={photoUrl} alt={title || 'Foto'} className="w-full h-full object-cover" />
        </div>

        <div className="p-5 flex flex-col gap-3 text-left">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">Título</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ponle un título a esta foto"
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade una descripción (opcional)"
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white transition-colors uppercase tracking-widest text-xs font-semibold cursor-pointer mt-1"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
