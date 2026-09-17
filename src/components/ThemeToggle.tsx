import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 shadow-sm transition-colors cursor-pointer ${className}`}
      aria-label={resolvedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
