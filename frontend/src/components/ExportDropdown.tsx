import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useExport } from '../context/ExportContext';
import { ExportIcon, ChevronDownIcon } from './Icons';

const CsvIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const ImageIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const PdfIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15h6" />
  </svg>
);

export function ExportDropdown() {
  const { t } = useTranslation();
  const { getHandlers, hasHandlers, exporting, setExporting } = useExport();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!hasHandlers) return null;

  const handleExport = async (type: 'csv' | 'png' | 'pdf') => {
    const handlers = getHandlers();
    const fn = handlers[type];
    if (!fn || exporting) return;
    try {
      setExporting(type);
      await fn();
    } catch (err) {
      console.error(`Export ${type} failed:`, err);
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const handlers = getHandlers();
  const items: { type: 'csv' | 'png' | 'pdf'; icon: React.ReactNode; label: string }[] = [];
  if (handlers.csv) items.push({ type: 'csv', icon: <CsvIcon />, label: t('export_csv') });
  if (handlers.png) items.push({ type: 'png', icon: <ImageIcon />, label: t('export_png') });
  if (handlers.pdf) items.push({ type: 'pdf', icon: <PdfIcon />, label: t('export_pdf') });

  return (
    <div ref={ref} className="relative export-exclude">
      <button
        onClick={() => setOpen(!open)}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all duration-150 cursor-pointer disabled:opacity-40 focus-ring"
      >
        {exporting ? (
          <div className="loading-spinner" style={{ borderTopColor: 'white', width: 14, height: 14, borderWidth: 1.5 }} />
        ) : (
          <ExportIcon size={13} />
        )}
        <span className="hidden sm:inline">{exporting ? t('exporting') : t('export')}</span>
        <ChevronDownIcon size={12} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-md overflow-hidden z-50 animate-dropdown">
          {items.map((item) => (
            <button
              key={item.type}
              onClick={() => handleExport(item.type)}
              disabled={!!exporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer disabled:opacity-30"
            >
              <span className="text-[var(--text-muted)]">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {exporting === item.type && (
                <div className="loading-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}