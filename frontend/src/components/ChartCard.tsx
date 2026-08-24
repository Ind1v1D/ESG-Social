import { forwardRef, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { exportToPNG } from '../utils/exportUtils';
import { CameraIcon } from './Icons';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  exportFilename?: string;
}

export const ChartCard = forwardRef<HTMLDivElement, ChartCardProps>(
  function ChartCard({ title, children, exportFilename }, ref) {
    const { t } = useTranslation();
    const innerRef = useRef<HTMLDivElement>(null);
    const cardRef = (ref as React.RefObject<HTMLDivElement>) || innerRef;

    const handlePNG = async () => {
      if (!cardRef.current) return;
      const name = exportFilename || title.toLowerCase().replace(/\s+/g, '-');
      await exportToPNG(cardRef.current, `${name}-${new Date().getFullYear()}.png`);
    };

    return (
      <div
        ref={cardRef}
        className="card p-5 group min-w-0 overflow-hidden stagger-child"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h3>
          <button
            onClick={handlePNG}
            title={t('export_png')}
            className="export-exclude opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all duration-150 cursor-pointer"
          >
            <CameraIcon size={12} />
            <span>PNG</span>
          </button>
        </div>
        <div className="w-full min-w-0" style={{ height: 320 }}>
          {children}
        </div>
      </div>
    );
  },
);