import { useEffect, useState } from 'react';
import { Share2, Copy, Check, Loader2, X } from 'lucide-react';

interface ShareControlProps {
  folderId?: string;
  isSignedIn: boolean;
}

export default function ShareControl({ folderId, isSignedIn }: ShareControlProps) {
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(null);
    setError(null);
    if (!folderId || !isSignedIn) {
      setChecking(false);
      return;
    }
    setChecking(true);
    fetch(`/api/share/status?folderId=${encodeURIComponent(folderId)}`)
      .then((res) => res.json())
      .then((data) => setToken(data.token || null))
      .catch(() => {
        // Non-fatal: the user can still try "Compartir" directly.
      })
      .finally(() => setChecking(false));
  }, [folderId, isSignedIn]);

  if (!isSignedIn || !folderId) {
    return (
      <p className="text-[11px] text-gray-400 leading-relaxed">
        Inicia sesión y guarda este globo en Drive para poder compartirlo con un enlace público.
      </p>
    );
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Comprobando si ya está compartido…
      </div>
    );
  }

  const shareUrl = token ? `${window.location.origin}/share/${token}` : null;

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo compartir este globo.');
      setToken(data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo compartir este globo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo dejar de compartir.');
      }
      setToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo dejar de compartir.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (shareUrl) {
    return (
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-gray-300 text-gray-600 bg-gray-50 truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center justify-center px-2.5 py-2 border border-gray-900 bg-gray-900 text-white hover:bg-black transition-colors cursor-pointer shrink-0"
            aria-label="Copiar enlace"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleRevoke}
          disabled={loading}
          className="text-[11px] uppercase tracking-widest text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1 disabled:opacity-50 self-start"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Dejar de compartir
        </button>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-1.5">
      <button
        onClick={handleShare}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        Compartir este globo
      </button>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
