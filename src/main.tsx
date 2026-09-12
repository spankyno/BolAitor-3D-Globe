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

const tree = (
  <DriveAuthProvider>
    <App />
  </DriveAuthProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {CLERK_PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{tree}</ClerkProvider>
    ) : (
      tree
    )}
  </StrictMode>,
);
