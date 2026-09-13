import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ClerkProvider} from '@clerk/clerk-react';
import App from './App.tsx';
import {DriveAuthProvider} from './context/DriveAuthContext.tsx';
import './index.css';

// Clerk centraliza registro, login (incluido "Continuar con Google") y
// gestión de sesión. Si no se configura la clave pública, la app sigue
// funcionando (destinos curados + fotos locales), simplemente sin login.
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

// Las páginas de globo compartido (/share/:token) son públicas y de solo
// lectura: no necesitan Clerk ni el contexto de Drive, así que los
// visitantes anónimos no cargan ese JS de más.
const IS_SHARE_PAGE = /^\/share\/[A-Za-z0-9_-]+\/?$/.test(window.location.pathname);

const tree = IS_SHARE_PAGE ? (
  <App />
) : (
  <DriveAuthProvider>
    <App />
  </DriveAuthProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {CLERK_PUBLISHABLE_KEY && !IS_SHARE_PAGE ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{tree}</ClerkProvider>
    ) : (
      tree
    )}
  </StrictMode>,
);
