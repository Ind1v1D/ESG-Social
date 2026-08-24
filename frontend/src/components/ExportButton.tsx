interface ExportButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

export function ExportButton({
  label,
  icon,
  onClick,
  loading = false,
  variant = 'default',
  disabled = false,
}: ExportButtonProps) {
  const base =
    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed export-exclude';

  const variants = {
    default:
      'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white',
    primary:
      'bg-teal-500 border border-teal-400 text-slate-950 font-semibold hover:bg-teal-400 hover:shadow-lg hover:shadow-teal-500/25',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="text-base">{icon}</span>
      )}
      <span>{label}</span>
    </button>
  );
}
