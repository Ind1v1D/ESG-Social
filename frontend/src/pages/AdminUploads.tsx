import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { ChevronLeftIcon, LogoIcon, CloseIcon } from '../components/Icons';

interface UploadItem {
    id: number;
    filename: string;
    created_at: string;
    created_by: string;
    status: string;
    errors_count: number;
    warnings_count: number;
    is_active: boolean;
}

interface AdminUser {
    id: number;
    username: string;
    is_active: boolean;
    created_at: string | null;
}

export function AdminUploads() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('admin_token');
    const fileRef = useRef<HTMLInputElement>(null);

    const [tab, setTab] = useState<'uploads' | 'users'>('uploads');
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [msg, setMsg] = useState('');
    const [msgError, setMsgError] = useState(false);

    // Users state
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetPwUserId, setResetPwUserId] = useState<number | null>(null);
    const [resetPw, setResetPw] = useState('');

    const showMessage = (text: string, isError = false) => {
        setMsg(text);
        setMsgError(isError);
    };

    useEffect(() => {
        if (!token) { navigate('/admin'); return; }
        loadUploads();
        loadAdmins();
    }, []);

    const loadUploads = async () => {
        try {
            const res = await api.getUploads(token!);
            setUploads(res.uploads);
        } catch {
            localStorage.removeItem('admin_token');
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const loadAdmins = async () => {
        try {
            const res = await api.getAdmins(token!);
            setAdmins(res.admins);
        } catch { /* ignore */ }
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadResult(null);
        setMsg('');
        setMsgError(false);
        try {
            const res = await api.uploadFile(token!, file);
            setUploadResult(res);
            if (res.errors_count === 0) showMessage(t('upload_success'));
            loadUploads();
        } catch (err: any) {
            showMessage(err.message || t('upload_failed'), true);
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handlePublish = async (id: number) => {
        try { await api.publish(token!, id); showMessage(t('dataset_published', { id })); loadUploads(); }
        catch (err: any) { showMessage(err.message || t('publish_failed'), true); }
    };

    const handleRollback = async (id: number) => {
        try { await api.rollback(token!, id); showMessage(t('rolled_back_to', { id })); loadUploads(); }
        catch (err: any) { showMessage(err.message || t('rollback_failed'), true); }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await api.downloadTemplate(token!);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'social_dashboard_template.xlsx'; a.click();
            URL.revokeObjectURL(url);
        } catch { showMessage(t('template_failed'), true); }
    };

    const handleAddAdmin = async () => {
        if (!newUsername.trim() || !newPassword.trim()) return;
        try {
            await api.createAdmin(token!, newUsername.trim(), newPassword);
            showMessage(`Admin "${newUsername}" created`);
            setNewUsername(''); setNewPassword(''); setShowAddUser(false);
            loadAdmins();
        } catch (err: any) { showMessage(err.message || 'Failed', true); }
    };

    const handleToggleAdmin = async (id: number, currentActive: boolean) => {
        try {
            await api.updateAdmin(token!, id, { is_active: !currentActive });
            loadAdmins();
        } catch (err: any) { showMessage(err.message || 'Failed', true); }
    };

    const handleResetPassword = async (id: number) => {
        if (!resetPw.trim()) return;
        try {
            await api.updateAdmin(token!, id, { password: resetPw });
            showMessage('Password updated');
            setResetPwUserId(null); setResetPw('');
        } catch (err: any) { showMessage(err.message || 'Failed', true); }
    };

    const handleDeleteAdmin = async (id: number) => {
        if (!confirm(t('admin_confirm_delete'))) return;
        try {
            await api.deleteAdmin(token!, id);
            loadAdmins();
        } catch (err: any) { showMessage(err.message || 'Failed', true); }
    };

    const handleLogout = () => { localStorage.removeItem('admin_token'); navigate('/admin'); };

    if (loading) return (
        <div className="flex items-center justify-center h-64" style={{ background: 'var(--bg-page)' }}>
            <div className="flex flex-col items-center gap-2 stagger-child">
                <div className="loading-spinner" />
                <span className="text-[12px] text-[var(--text-muted)]">{t('loading')}</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-4 lg:p-6" style={{ background: 'var(--bg-page)' }}>
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between stagger-child">
                    <div className="flex items-center gap-2.5">
                        <LogoIcon size={28} />
                        <div>
                            <h1 className="text-lg font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('admin_panel')}</h1>
                            <p className="text-[12px] text-[var(--text-muted)]">{t('admin_manage')}</p>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-[12px] py-1.5 px-3"><ChevronLeftIcon size={12} className="inline mr-1" />{t('back_to_dashboard')}</button>
                        <button onClick={handleLogout} className="btn-secondary text-[12px] py-1.5 px-3 text-[var(--danger)] border-[var(--danger)]/20 hover:bg-[var(--danger-soft)]">{t('logout')}</button>
                    </div>
                </div>

                {msg && (
                    <div className={`${msgError ? 'bg-[var(--danger-soft)] border-[var(--danger)]/20 text-[var(--danger)]' : 'bg-[var(--success-soft)] border-[var(--success)]/20 text-[var(--success)]'} border rounded-lg p-2.5 text-[12px] animate-fade-up flex items-center justify-between`}>
                        {msg}
                        <button onClick={() => setMsg('')} className="ml-2 text-[var(--text-muted)] hover:text-[var(--text)]"><CloseIcon size={12} /></button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] w-fit">
                    <button
                        onClick={() => setTab('uploads')}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${tab === 'uploads' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                        style={{ fontFamily: 'var(--font-ui)' }}
                    >
                        {t('admin_tab_uploads')}
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        className={`px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${tab === 'users' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
                        style={{ fontFamily: 'var(--font-ui)' }}
                    >
                        {t('admin_tab_users')}
                    </button>
                </div>

                {/* Uploads Tab */}
                {tab === 'uploads' && (
                    <div className="space-y-4">
                        <div className="card p-4 stagger-child" style={{ animationDelay: '60ms' }}>
                            <h2 className="text-[13px] font-semibold mb-2.5 text-[var(--text)]">{t('upload_new_dataset')}</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input ref={fileRef} type="file" accept=".xlsx,.xls"
                                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--text)] file:mr-2 file:rounded-md file:border-0 file:bg-[var(--accent-soft)] file:text-[var(--accent)] file:px-2.5 file:py-1 file:text-[11px] file:font-medium transition-colors" />
                                <button onClick={handleUpload} disabled={uploading} className="btn-primary whitespace-nowrap">
                                    {uploading ? (
                                        <span className="flex items-center gap-1.5">
                                            <div className="loading-spinner" style={{ borderTopColor: 'white', width: 12, height: 12, borderWidth: 1.5 }} />
                                            {t('uploading')}
                                        </span>
                                    ) : t('upload_validate')}
                                </button>
                                <button onClick={handleDownloadTemplate} className="btn-secondary whitespace-nowrap text-[12px]">
                                    {t('template')}
                                </button>
                            </div>
                        </div>

                        {uploadResult && (
                            <div className="card p-4 space-y-2.5 animate-scale-in">
                                <h3 className="text-[13px] font-semibold text-[var(--text)]">{t('validation_result')}</h3>
                                <div className="flex gap-2">
                                    <span className={`badge badge-animate ${uploadResult.errors_count ? 'badge-danger' : 'badge-success'}`}>{uploadResult.errors_count} {t('errors')}</span>
                                    <span className="badge badge-animate badge-warning">{uploadResult.warnings_count} warnings</span>
                                    <span className={`badge badge-animate ${uploadResult.status === 'draft' ? 'badge-info' : 'badge-danger'}`}>{uploadResult.status}</span>
                                </div>
                                {uploadResult.errors?.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {uploadResult.errors.map((e: any, i: number) => (
                                            <div key={i} className="text-[11px] text-[var(--danger)] bg-[var(--danger-soft)] rounded-md px-2.5 py-1.5 stagger-child" style={{ animationDelay: `${i * 30}ms` }}>
                                                <strong>[{e.sheet}]</strong> Row {e.row} → <strong>{e.field}</strong>: {e.message}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {uploadResult.warnings?.length > 0 && (
                                    <details className="cursor-pointer">
                                        <summary className="text-[11px] text-[var(--warning)]">{t('show_warnings', { count: uploadResult.warnings.length })}</summary>
                                        <div className="max-h-28 overflow-y-auto space-y-1 mt-1.5">
                                            {uploadResult.warnings.map((w: any, i: number) => (
                                                <div key={i} className="text-[11px] text-[var(--warning)] bg-[var(--warning-soft)] rounded-md px-2.5 py-1.5 stagger-child" style={{ animationDelay: `${i * 30}ms` }}>
                                                    <strong>[{w.sheet}]</strong> Row {w.row} → <strong>{w.field}</strong>: {w.message}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="card overflow-hidden stagger-child" style={{ animationDelay: '120ms' }}>
                            <div className="px-4 py-2.5 border-b border-[var(--border)]">
                                <h2 className="text-[13px] font-semibold text-[var(--text)]">{t('upload_history')}</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            {[t('id'), t('file'), t('date'), t('status'), t('errors'), t('actions')].map(h => (
                                                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploads.map((u, i) => (
                                            <tr key={u.id} className={`border-b border-[var(--border)]/50 transition-colors table-row-enter ${u.is_active ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-hover)]'}`} style={{ animationDelay: `${i * 30}ms` }}>
                                                <td className="px-3 py-2 font-mono text-[11px] text-[var(--text)]">#{u.id}</td>
                                                <td className="px-3 py-2 text-[var(--text)]">{u.filename}</td>
                                                <td className="px-3 py-2 text-[11px] text-[var(--text-muted)]">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`badge badge-animate ${u.status === 'published' ? 'badge-success' : u.status === 'failed' ? 'badge-danger' : 'badge-info'}`}>{u.status}</span>
                                                    {u.is_active && <span className="badge badge-animate badge-success ml-1">{t('active')}</span>}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {u.errors_count > 0 && <span className="text-[var(--danger)]">{u.errors_count}</span>}
                                                    {u.warnings_count > 0 && <span className="text-[var(--warning)] ml-1.5">{u.warnings_count}</span>}
                                                </td>
                                                <td className="px-3 py-2 space-x-1.5">
                                                    {u.status !== 'failed' && !u.is_active && (
                                                        <button onClick={() => handlePublish(u.id)} className="btn-primary text-[11px] py-1 px-2.5">{t('publish')}</button>
                                                    )}
                                                    {u.status !== 'failed' && !u.is_active && (
                                                        <button onClick={() => handleRollback(u.id)} className="btn-secondary text-[11px] py-1 px-2.5">{t('rollback')}</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {uploads.length === 0 && (
                                            <tr><td colSpan={6} className="text-center py-6 text-[var(--text-muted)]">{t('no_uploads')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {tab === 'users' && (
                    <div className="space-y-4">
                        <div className="card p-4 stagger-child" style={{ animationDelay: '60ms' }}>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-[13px] font-semibold text-[var(--text)]">{t('admin_users')}</h2>
                                <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary text-[12px] py-1.5 px-3">
                                    {t('admin_add_user')}
                                </button>
                            </div>

                            {showAddUser && (
                                <div className="flex flex-col sm:flex-row gap-2 mb-3 p-3 bg-[var(--bg-page)] rounded-lg border border-[var(--border)] animate-scale-in">
                                    <input
                                        value={newUsername}
                                        onChange={e => setNewUsername(e.target.value)}
                                        placeholder={t('admin_username')}
                                        className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--text)]"
                                    />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder={t('admin_password')}
                                        className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[12px] text-[var(--text)]"
                                    />
                                    <button onClick={handleAddAdmin} className="btn-primary text-[12px] py-1.5 px-4">{t('admin_add_user')}</button>
                                    <button onClick={() => { setShowAddUser(false); setNewUsername(''); setNewPassword(''); }} className="btn-secondary text-[12px] py-1.5 px-3"><CloseIcon size={12} /></button>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-[var(--border)]">
                                            {[t('id'), t('admin_username'), t('admin_status'), t('admin_created'), t('admin_actions')].map(h => (
                                                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {admins.map((a, i) => (
                                            <tr key={a.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-hover)] transition-colors table-row-enter" style={{ animationDelay: `${i * 30}ms` }}>
                                                <td className="px-3 py-2 font-mono text-[11px] text-[var(--text)]">#{a.id}</td>
                                                <td className="px-3 py-2 text-[var(--text)] font-medium">{a.username}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`badge badge-animate ${a.is_active ? 'badge-success' : 'badge-danger'}`}>
                                                        {a.is_active ? t('admin_active') : t('admin_inactive')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
                                                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-3 py-2 space-x-1.5">
                                                    {resetPwUserId === a.id ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <input
                                                                type="password"
                                                                value={resetPw}
                                                                onChange={e => setResetPw(e.target.value)}
                                                                placeholder={t('admin_password')}
                                                                className="w-28 bg-[var(--bg-input)] border border-[var(--border)] rounded px-2 py-1 text-[11px] text-[var(--text)]"
                                                                onKeyDown={e => e.key === 'Enter' && handleResetPassword(a.id)}
                                                            />
                                                            <button onClick={() => handleResetPassword(a.id)} className="btn-primary text-[10px] py-0.5 px-2">OK</button>
                                                            <button onClick={() => { setResetPwUserId(null); setResetPw(''); }} className="btn-secondary text-[10px] py-0.5 px-2"><CloseIcon size={10} /></button>
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleToggleAdmin(a.id, a.is_active)} className="btn-secondary text-[11px] py-1 px-2.5">
                                                                {a.is_active ? t('admin_disable') : t('admin_enable')}
                                                            </button>
                                                            <button onClick={() => { setResetPwUserId(a.id); setResetPw(''); }} className="btn-secondary text-[11px] py-1 px-2.5">{t('admin_reset_password')}</button>
                                                            <button onClick={() => handleDeleteAdmin(a.id)} className="btn-secondary text-[11px] py-1 px-2.5 text-[var(--danger)]">{t('admin_delete')}</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {admins.length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-6 text-[var(--text-muted)]">No admins found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
