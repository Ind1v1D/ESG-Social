const BASE = '';

async function fetchJSON(url: string, options?: RequestInit) {
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Request failed');
    }
    return res.json();
}

function authHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}

function withParams(path: string, params: Record<string, string | number | undefined>) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') p.set(k, String(v));
    }
    const qs = p.toString();
    return qs ? `${path}?${qs}` : path;
}

/* ── Public ─────────────────────────────────── */
export const api = {
    getActiveVersion: () => fetchJSON(`${BASE}/api/active-version`),
    getFilters: () => fetchJSON(`${BASE}/api/filters`),
    getSummary: (year?: number, faculty?: string) =>
        fetchJSON(withParams(`${BASE}/api/summary`, { year, faculty })),
    getGender: (year?: number, faculty?: string) =>
        fetchJSON(withParams(`${BASE}/api/gender`, { year, faculty })),
    getEngagement: (year?: number, faculty?: string) =>
        fetchJSON(withParams(`${BASE}/api/engagement`, { year, faculty })),
    getVolunteering: (year?: number, faculty?: string) =>
        fetchJSON(withParams(`${BASE}/api/volunteering`, { year, faculty })),
    getEsgCourses: (year?: number, faculty?: string) =>
        fetchJSON(withParams(`${BASE}/api/esg-courses`, { year, faculty })),

    /* ── Admin ──────────────────────────────────── */
    login: (username: string, password: string) =>
        fetchJSON(`${BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        }),
    getUploads: (token: string) =>
        fetchJSON(`${BASE}/api/admin/uploads`, { headers: authHeaders(token) }),
    uploadFile: (token: string, file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        return fetchJSON(`${BASE}/api/admin/upload`, {
            method: 'POST',
            headers: authHeaders(token),
            body: fd,
        });
    },
    publish: (token: string, id: number) =>
        fetchJSON(`${BASE}/api/admin/publish/${id}`, {
            method: 'POST',
            headers: authHeaders(token),
        }),
    rollback: (token: string, id: number) =>
        fetchJSON(`${BASE}/api/admin/rollback/${id}`, {
            method: 'POST',
            headers: authHeaders(token),
        }),
    downloadTemplate: (token: string) =>
        fetch(`${BASE}/api/admin/template`, { headers: authHeaders(token) })
            .then(r => r.blob()),

    /* ── Admin Management ─────────────────────── */
    getAdmins: (token: string) =>
        fetchJSON(`${BASE}/api/admin/admins`, { headers: authHeaders(token) }),
    createAdmin: (token: string, username: string, password: string) =>
        fetchJSON(`${BASE}/api/admin/admins`, {
            method: 'POST',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        }),
    updateAdmin: (token: string, id: number, data: { password?: string; is_active?: boolean }) =>
        fetchJSON(`${BASE}/api/admin/admins/${id}`, {
            method: 'PUT',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
    deleteAdmin: (token: string, id: number) =>
        fetchJSON(`${BASE}/api/admin/admins/${id}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        }),
};
