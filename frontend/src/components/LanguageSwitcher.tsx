import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-input)] p-0.5">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer focus-ring transition-all duration-150 ${
            i18n.language === lang.code
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}