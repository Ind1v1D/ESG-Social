import { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface ExportHandlers {
  csv?: () => void | Promise<void>;
  png?: () => void | Promise<void>;
  pdf?: () => void | Promise<void>;
}

interface ExportContextType {
  /** Get current handlers (ref-based, never triggers re-render) */
  getHandlers: () => ExportHandlers;
  /** Register handlers — stores in ref, does NOT cause re-render */
  registerHandlers: (h: ExportHandlers) => void;
  /** Clear handlers — stores in ref, does NOT cause re-render */
  clearHandlers: () => void;
  /** Whether we have handlers registered (triggers re-render only on change) */
  hasHandlers: boolean;
  setHasHandlers: (v: boolean) => void;
  exporting: 'csv' | 'png' | 'pdf' | null;
  setExporting: (v: 'csv' | 'png' | 'pdf' | null) => void;
}

const EMPTY: ExportHandlers = {};

const ExportContext = createContext<ExportContextType>({
  getHandlers: () => EMPTY,
  registerHandlers: () => {},
  clearHandlers: () => {},
  hasHandlers: false,
  setHasHandlers: () => {},
  exporting: null,
  setExporting: () => {},
});

export function ExportProvider({ children }: { children: ReactNode }) {
  // Store handlers in a REF to avoid re-renders when pages register/clear
  const handlersRef = useRef<ExportHandlers>(EMPTY);
  // Only this boolean triggers re-renders (show/hide export button)
  const [hasHandlers, setHasHandlers] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'png' | 'pdf' | null>(null);

  const getHandlers = useCallback(() => handlersRef.current, []);

  const registerHandlers = useCallback((h: ExportHandlers) => {
    handlersRef.current = h;
    setHasHandlers(!!(h.csv || h.png || h.pdf));
  }, []);

  const clearHandlers = useCallback(() => {
    handlersRef.current = EMPTY;
    setHasHandlers(false);
  }, []);

  return (
    <ExportContext.Provider value={{ getHandlers, registerHandlers, clearHandlers, hasHandlers, setHasHandlers, exporting, setExporting }}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExport() {
  return useContext(ExportContext);
}
