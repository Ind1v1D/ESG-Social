import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { LogoIcon } from '../components/Icons';

export function AdminLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('admin_token', res.access_token);
      navigate('/admin/uploads');
    } catch (err: any) {
      setError(err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="card w-full max-w-sm p-6 animate-scale-in">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3">
            <LogoIcon size={48} />
          </div>
          <h1 className="text-lg font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('admin_panel')}</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">{t('admin_subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg p-2.5 text-[12px] text-[var(--danger)] animate-fade-up">{error}</div>
          )}
          <div className="stagger-child">
            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('username')}</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors" />
          </div>
          <div className="stagger-child" style={{ animationDelay: '60ms' }}>
            <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors" />
          </div>
          <div className="stagger-child pt-1" style={{ animationDelay: '120ms' }}>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[13px]">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="loading-spinner" style={{ borderTopColor: 'white', width: 14, height: 14, borderWidth: 1.5 }} />
                  {t('signing_in')}
                </span>
              ) : t('sign_in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}