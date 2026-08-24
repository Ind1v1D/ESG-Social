import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';

interface FilterContextType {
    years: number[];
    faculties: string[];
    selectedYear: number | undefined;
    selectedFaculty: string | undefined;
    setSelectedYear: (y: number | undefined) => void;
    setSelectedFaculty: (f: string | undefined) => void;
    refreshVersion: number;
    triggerRefresh: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [years, setYears] = useState<number[]>([]);
    const [faculties, setFaculties] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
    const [selectedFaculty, setSelectedFaculty] = useState<string | undefined>(undefined);
    const [refreshVersion, setRefreshVersion] = useState(0);

    const triggerRefresh = useCallback(() => setRefreshVersion(v => v + 1), []);

    useEffect(() => {
        api.getFilters()
            .then(f => {
                setYears(f.years || []);
                setFaculties(f.faculties || []);

                // Set default year only on first load if nothing selected yet
                setSelectedYear(prev => {
                    if (prev !== undefined) return prev;
                    return f.years?.length ? f.years[0] : undefined;
                });
            })
            .catch(() => {
                setYears([]);
                setFaculties([]);
            });
    }, [refreshVersion]);

    return (
        <FilterContext.Provider
            value={{
                years,
                faculties,
                selectedYear,
                selectedFaculty,
                setSelectedYear,
                setSelectedFaculty,
                refreshVersion,
                triggerRefresh,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const ctx = useContext(FilterContext);
    if (!ctx) {
        throw new Error('useFilters must be used inside FilterProvider');
    }
    return ctx;
}