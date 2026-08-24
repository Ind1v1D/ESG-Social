import { useTranslation } from 'react-i18next';
import { useFilters } from '../context/FilterContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ExportDropdown } from './ExportDropdown';
import { FilterIcon } from './Icons';

export function FilterBar() {
  const { t } = useTranslation();
  const { years, faculties, selectedYear, selectedFaculty, setSelectedYear, setSelectedFaculty } = useFilters();

  return (
    <div className="flex items-center gap-2.5 px-4 lg:px-6 py-2.5 bg-[var(--bg-card)] border-b border-[var(--border)] sticky top-0 z-10 w-full">
      <div className="hidden lg:flex items-center gap-1.5 text-[var(--text-muted)]">
        <FilterIcon size={13} />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{t('filters')}</span>
      </div>
      <select
        value={selectedYear || ''}
        onChange={e => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
        className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] text-[13px] rounded-lg px-2.5 py-1.5 focus:border-[var(--accent)] focus:outline-none transition-colors cursor-pointer"
      >
        <option value="">{t('all_years')}</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={selectedFaculty || ''}
        onChange={e => setSelectedFaculty(e.target.value || undefined)}
        className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] text-[13px] rounded-lg px-2.5 py-1.5 focus:border-[var(--accent)] focus:outline-none transition-colors cursor-pointer"
      >
        <option value="">{t('all_faculties')}</option>
        {faculties.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      <div className="flex-1" />
      <ExportDropdown />
      <LanguageSwitcher />
    </div>
  );
}