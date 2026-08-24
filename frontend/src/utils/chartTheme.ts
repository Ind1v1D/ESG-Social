import { useTheme } from '../context/ThemeContext';

export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    tooltip: {
      background: dark ? '#242424' : '#FFFFFF',
      border: `1px solid ${dark ? '#333333' : '#E2E8F0'}`,
      borderRadius: 10,
      color: dark ? '#E0E0E0' : '#1E293B',
      fontSize: 13,
    } as React.CSSProperties,
    axisTick: { fill: dark ? '#9E9E9E' : '#64748B', fontSize: 11 },
    axisLine: { stroke: dark ? '#333333' : '#E2E8F0' },
    legend: { color: dark ? '#9E9E9E' : '#64748B' } as React.CSSProperties,
    grid: { stroke: dark ? '#2A2A2A' : '#F1F5F9' },
    dot: (color: string) => ({
      r: 5,
      fill: color,
      stroke: dark ? '#242424' : '#FFFFFF',
      strokeWidth: 2,
    }),
    barRadius: [4, 4, 0, 0] as [number, number, number, number],
    lineStrokeWidth: 2.5,
  };
}