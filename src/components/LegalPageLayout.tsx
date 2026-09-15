import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-6 py-10 sm:py-14">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BolAitor 3D Globe
        </a>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-display mb-1">
          {title}
        </h1>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-8">Última actualización: {updatedAt}</p>

        <div className="prose prose-neutral max-w-none text-sm sm:text-[15px] leading-relaxed text-gray-700 space-y-5 [&_h2]:text-gray-900 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-gray-900 [&_a]:underline">
          {children}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400">
          <a href="/" className="hover:text-gray-700 transition-colors">← Volver a BolAitor 3D Globe</a>
        </div>
      </div>
    </div>
  );
}
