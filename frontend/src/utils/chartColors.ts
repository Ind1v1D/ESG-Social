import { useTheme } from '../context/ThemeContext';

export function useChartColors() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    primary: dark ? '#4DEEEA' : '#0F766E',
    secondary: dark ? '#64B5F6' : '#1E3A5F',
    accent: dark ? '#F48FB1' : '#D97706',
    danger: dark ? '#F48FB1' : '#DC2626',
    purple: dark ? '#CE93D8' : '#7C3AED',
    all: dark
      ? ['#4DEEEA', '#64B5F6', '#F48FB1', '#FFD54F', '#CE93D8']
      : ['#0F766E', '#1E3A5F', '#D97706', '#DC2626', '#7C3AED'],
  };
}