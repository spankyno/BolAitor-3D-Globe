import { Plus, Globe2, Cloud, CloudOff, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { Collection } from '../types/collection';

interface CollectionsScreenProps {
  collections: Collection[];
  loading: boolean;
  isSignedIn: boolean;
  onOpen: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  creating: boolean;
}

export default function CollectionsScreen({
  collections,
  loading,
  isSignedIn,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  onBack,
  creating,
}: CollectionsScreenProps) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewName('');
  };

  const startRename = (c: Collection) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const confirmRename = () => {
    const trimmed = editingName.trim();
    if (editingId && trimmed) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="w-full text-left">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Mis globos</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Crea distintas colecciones con nombre (p. ej. "Japón 2025", "Boda de Ana") y explora cada una como un globo 3D independiente.
        </p>
        {!isSignedIn && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-2">
            <CloudOff className="w-3.5 h-3.5" />
            Inicia sesión para guardar tus globos en Google Drive y no perderlos al recargar
          </p>
        )}
      </div>

      {/* Create new collection */}
      <div className="flex gap-2 w-full">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nombre del nuevo globo…"
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="flex items-center justify-center gap-1.5 px-3.5 border border-gray-900 bg-gray-900 text-white text-xs uppercase tracking-wider font-medium hover:bg-black transition-colors disabled:opacity-40 cursor-pointer"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Cargando tus globos guardados…
        </div>
      )}

      {!loading && collections.length === 0 && (
        <p className="text-xs text-gray-400 py-6">Todavía no tienes ningún globo. Crea el primero arriba ↑</p>
      )}

      {!loading && collections.length > 0 && (
        <div className="w-full flex flex-col gap-2 max-h-80 overflow-y-auto">
          {collections.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 border border-gray-200 hover:border-gray-400 transition-colors px-3 py-2.5 group"
            >
              <Globe2 className="w-4 h-4 text-gray-400 shrink-0" />

              {editingId === c.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                  className="flex-1 min-w-0 text-sm border-b border-gray-400 focus:outline-none"
                />
              ) : (
                <button onClick={() => onOpen(c.id)} className="flex-1 min-w-0 text-left cursor-pointer">
                  <span className="text-sm text-gray-800 font-medium truncate block">{c.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {c.photoCount ?? c.photos.length} foto{(c.photoCount ?? c.photos.length) === 1 ? '' : 's'}
                  </span>
                </button>
              )}

              {c.driveFolderId ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              )}

              {editingId === c.id ? (
                <>
                  <button onClick={confirmRename} className="text-emerald-600 hover:text-emerald-800 cursor-pointer" aria-label="Guardar nombre">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer" aria-label="Cancelar">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startRename(c)}
                    className="text-gray-300 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Renombrar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el globo "${c.name}" y todas sus fotos? Esta acción no se puede deshacer.`)) {
                        onDelete(c.id);
                      }
                    }}
                    className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 cursor-pointer mt-1"
      >
        Volver al menú
      </button>
    </div>
  );
}
