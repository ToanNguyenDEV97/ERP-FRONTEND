import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

function useTheme(): [Theme, (theme: Theme) => void] {
    const getInitialTheme = (): Theme => {
        if (typeof window !== 'undefined') {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
                return storedTheme as Theme;
            }
        }
        return 'system';
    };

    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    const applyTheme = useCallback((selectedTheme: Theme) => {
        const root = window.document.documentElement;
        const isDark = 
            selectedTheme === 'dark' || 
            (selectedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(isDark ? 'dark' : 'light');
    }, []);

    useEffect(() => {
        applyTheme(theme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    };

    return [theme, setTheme];
}

export default useTheme;
