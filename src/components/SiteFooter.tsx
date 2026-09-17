const CURRENT_YEAR = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="w-full flex flex-col items-center gap-1.5 py-3 text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a href="/privacidad" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Política de Privacidad
        </a>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        <a href="/terminos" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          Condiciones del servicio
        </a>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        <a
          href="https://aitorsanchez.pages.dev/contacto"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Contacto
        </a>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        <a
          href="https://aitorsanchez.pages.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Blog
        </a>
        <span className="text-gray-300 dark:text-gray-700">·</span>
        <a
          href="https://aitorhub.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Más apps
        </a>
      </nav>
      <p className="normal-case tracking-normal text-gray-400 dark:text-gray-600">
        Aitor Sánchez Gutiérrez © {CURRENT_YEAR} - Reservados todos los derechos
      </p>
    </footer>
  );
}
