import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { Cloud, CloudOff, LogIn, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CLERK_CONFIGURED } from '../context/DriveAuthContext';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// --- Sign in / sign up entry point ---

export function SignInPrompt({ variant = 'menu' }: { variant?: 'menu' | 'inline' }) {
  if (!CLERK_CONFIGURED) {
    return (
      <button
        type="button"
        disabled
        title="Configura VITE_CLERK_PUBLISHABLE_KEY para activar el registro/login (ver README)"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px] font-medium cursor-not-allowed mt-1"
      >
        <CloudOff className="w-3.5 h-3.5" />
        Login no configurado
      </button>
    );
  }
  return <SignInPromptInner variant={variant} />;
}

function SignInPromptInner({ variant }: { variant: 'menu' | 'inline' }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || isSignedIn) return null;

  if (variant === 'inline') {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="text-[11px] uppercase tracking-widest flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
        >
          <LogIn className="w-3 h-3" />
          Iniciar sesión para guardarlas
        </button>
      </SignInButton>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase tracking-widest text-[10px] font-medium mt-1 cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
        Iniciar sesión / Crear cuenta
      </button>
    </SignInButton>
  );
}

// --- Signed-in account pill (avatar, name, sign out via Clerk's UserButton) ---

export function AccountPill() {
  if (!CLERK_CONFIGURED) return null;
  return <AccountPillInner />;
}

function AccountPillInner() {
  const { isSignedIn, user, isLoaded } = useUser();
  if (!isLoaded || !isSignedIn || !user) return null;

  return (
    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full pl-1.5 pr-2 py-1.5 mb-5">
      <img
        src={user.imageUrl}
        alt={user.fullName || 'Usuario'}
        className="w-6 h-6 rounded-full object-cover"
      />
      <span className="text-xs text-gray-700 dark:text-gray-200 font-medium max-w-[160px] truncate">
        {user.fullName || user.primaryEmailAddress?.emailAddress}
      </span>
      <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <UserButton afterSignOutUrl={window.location.origin} />
    </div>
  );
}

// --- Connect / grant Google Drive access (for accounts without the scope yet) ---

export function ConnectDriveButton() {
  if (!CLERK_CONFIGURED) return null;
  return <ConnectDriveButtonInner />;
}

function ConnectDriveButtonInner() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  if (!user) return null;
  const googleAccount = user.externalAccounts.find((a) => a.provider === 'google');

  const handleClick = async () => {
    setLoading(true);
    const redirectUrl = window.location.href;
    try {
      if (googleAccount) {
        await googleAccount.reauthorize({ additionalScopes: [DRIVE_SCOPE], redirectUrl });
      } else {
        await user.createExternalAccount({
          strategy: 'oauth_google',
          additionalScopes: [DRIVE_SCOPE],
          redirectUrl,
        });
      }
    } catch (e) {
      console.error('No se pudo iniciar la conexión con Google Drive', e);
      setLoading(false);
    }
    // On success the browser navigates away to Google's consent screen,
    // so there's no "finally" needed here.
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-colors uppercase tracking-wider text-[11px] font-medium cursor-pointer disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
      {googleAccount ? 'Conceder acceso a Google Drive' : 'Conectar cuenta de Google'}
    </button>
  );
}
