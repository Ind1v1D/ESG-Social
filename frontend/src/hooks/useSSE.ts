import { useEffect, useRef } from 'react';
import { useFilters } from '../context/FilterContext';

export function useSSE() {
    const { triggerRefresh } = useFilters();
    const lastVersionRef = useRef<string | null>(null);

    useEffect(() => {
        let es: EventSource | null = null;
        let pollTimer: ReturnType<typeof setInterval> | null = null;
        let sseActive = false;

        // Try SSE
        try {
            es = new EventSource('/api/realtime');
            es.addEventListener('published', () => {
                sseActive = true;
                triggerRefresh();
            });
            es.onerror = () => {
                // SSE failed — start polling
                if (!sseActive) startPolling();
            };
        } catch {
            startPolling();
        }

        // Polling fallback
        function startPolling() {
            if (pollTimer) return;
            pollTimer = setInterval(async () => {
                try {
                    const res = await fetch('/api/active-version');
                    const data = await res.json();
                    const vid = String(data.active_upload_id || '');
                    if (lastVersionRef.current !== null && vid !== lastVersionRef.current) {
                        triggerRefresh();
                    }
                    lastVersionRef.current = vid;
                } catch { /* ignore */ }
            }, 12000);
        }

        return () => {
            es?.close();
            if (pollTimer) clearInterval(pollTimer);
        };
    }, [triggerRefresh]);
}
