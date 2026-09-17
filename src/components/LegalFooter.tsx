export default function LegalFooter() {
  return (
    <footer className="w-full flex items-center justify-center gap-4 py-3 text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-mono">
      <a href="/privacidad" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
        Política de Privacidad
      </a>
      <span className="text-gray-300 dark:text-gray-700">·</span>
      <a href="/terminos" className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
        Condiciones del servicio
      </a>
    </footer>
  );
}
