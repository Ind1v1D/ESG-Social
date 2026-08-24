import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { useFilters } from '../context/FilterContext';
import { useExport } from '../context/ExportContext';
import { api } from '../api';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { DataTable } from '../components/DataTable';
import { PageSkeleton } from '../components/SkeletonLoader';
import { EngagementIcon } from '../components/Icons';
import { exportToCSV, exportToPNG, exportToPDF } from '../utils/exportUtils';
import { useChartTheme } from '../utils/chartTheme';
import { useChartColors } from '../utils/chartColors';

const COLUMNS = [
  { key: 'year', label: 'col_year' }, { key: 'faculty', label: 'col_faculty' },
  { key: 'satisfaction_pct', label: 'col_satisfaction_pct' }, { key: 'nps', label: 'col_nps' },
  { key: 'club_participation_pct', label: 'col_club_participation_pct' }, { key: 'avg_activities_per_student', label: 'col_avg_activities' },
];

export function EngagementPage() {
  const { t } = useTranslation();
  const { selectedYear, selectedFaculty, refreshVersion } = useFilters();
  const { registerHandlers, clearHandlers } = useExport();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ct = useChartTheme();
  const chartColors = useChartColors();

  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ data, selectedYear, selectedFaculty, t });
  stateRef.current = { data, selectedYear, selectedFaculty, t };

  useEffect(() => {
    setLoading(true);
    api.getEngagement(selectedYear, selectedFaculty).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [selectedYear, selectedFaculty, refreshVersion]);

  useEffect(() => {
    registerHandlers({
      csv: () => {
        const { data: d, selectedYear: yr, t: tr } = stateRef.current;
        if (!d?.data) return;
        exportToCSV(COLUMNS.map(c => ({ key: c.key, label: tr(c.label) })), d.data, `engagement-metrics-${yr || 'all'}`);
      },
      png: async () => { if (pageRef.current) await exportToPNG(pageRef.current, `engagement-report-${stateRef.current.selectedYear || 'all'}.png`); },
      pdf: async () => {
        const { data: d, selectedYear: yr, selectedFaculty: fac, t: tr } = stateRef.current;
        if (!d) return;
        const sections: { title: string; element: HTMLElement }[] = [];
        if (chartRef1.current) sections.push({ title: tr('chart_student_satisfaction'), element: chartRef1.current });
        if (chartRef2.current) sections.push({ title: tr('chart_satisfaction_trend'), element: chartRef2.current });
        await exportToPDF({ title: `${tr('report_title')} — ${tr('engagement')}`, subtitle: tr('engagement_page_subtitle'), year: yr, faculty: fac, generatedAt: new Date().toLocaleString(),
          kpis: [{ label: tr('kpi_satisfaction'), value: `${d.summary.avg_satisfaction_pct}%` }, { label: tr('kpi_avg_nps'), value: d.summary.avg_nps != null ? String(d.summary.avg_nps) : 'N/A' },
            { label: tr('kpi_records'), value: String(d.summary.total_records) }], sections, t: tr });
      },
    });
    return () => clearHandlers();
  }, [registerHandlers, clearHandlers]);

  if (loading) return <PageSkeleton />;
  if (!data?.data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4"><EngagementIcon size={22} /></div>
        <h3 className="text-[15px] font-semibold text-[var(--text)]">{t('no_engagement_data')}</h3>
      </div>
    );

  const satisfactionLabel = t('satisfaction'), clubLabel = t('club_participation'), avgSatisfactionLabel = t('avg_satisfaction');
  const byFaculty = data.data.reduce((acc: any[], r: any) => {
    const f = acc.find((x: any) => x.faculty === r.faculty);
    if (f) { f.satisfaction += r.satisfaction_pct; f.participation += r.club_participation_pct || 0; f.count += 1; }
    else { acc.push({ faculty: r.faculty, satisfaction: r.satisfaction_pct, participation: r.club_participation_pct || 0, count: 1 }); }
    return acc;
  }, []).map((f: any) => ({
    faculty: f.faculty.length > 15 ? f.faculty.substring(0, 15) + '…' : f.faculty,
    [satisfactionLabel]: Math.round(f.satisfaction / f.count * 10) / 10, [clubLabel]: Math.round(f.participation / f.count * 10) / 10,
  }));
  const byYear = data.data.reduce((acc: any[], r: any) => {
    const y = acc.find((x: any) => x.year === r.year);
    if (y) { y.satisfaction += r.satisfaction_pct; y.count += 1; }
    else { acc.push({ year: r.year, satisfaction: r.satisfaction_pct, count: 1 }); }
    return acc;
  }, []).map((y: any) => ({ year: y.year, [avgSatisfactionLabel]: Math.round(y.satisfaction / y.count * 10) / 10 })).sort((a: any, b: any) => a.year - b.year);
  const columns = COLUMNS.map(c => ({ key: c.key, label: t(c.label) }));

  return (
    <div ref={pageRef} className="w-full min-w-0 space-y-6">
      <div className="stagger-child">
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('engagement_page_title')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('engagement_page_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
        <KpiCard title={t('kpi_satisfaction')} value={`${data.summary.avg_satisfaction_pct}%`} icon={<EngagementIcon size={20} />} color="teal" />
        <KpiCard title={t('kpi_avg_nps')} value={data.summary.avg_nps != null ? data.summary.avg_nps : 'N/A'} icon={<EngagementIcon size={20} />} color="indigo" delay={80} />
        <KpiCard title={t('kpi_records')} value={data.summary.total_records} icon={<EngagementIcon size={20} />} color="amber" delay={160} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0 overflow-hidden">
        <ChartCard ref={chartRef1} title={t('chart_student_satisfaction')} exportFilename="engagement-satisfaction">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byFaculty}>
              <XAxis dataKey="faculty" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis domain={[0, 100]} tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
              <Legend wrapperStyle={ct.legend} />
              <Bar dataKey={satisfactionLabel} fill={chartColors.primary} radius={ct.barRadius} barSize={26} />
              <Bar dataKey={clubLabel} fill={chartColors.secondary} radius={ct.barRadius} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard ref={chartRef2} title={t('chart_satisfaction_trend')} exportFilename="engagement-trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid.stroke} />
              <XAxis dataKey="year" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis domain={[0, 100]} tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} />
              <Line type="monotone" dataKey={avgSatisfactionLabel} stroke={chartColors.primary} strokeWidth={ct.lineStrokeWidth} dot={ct.dot(chartColors.primary)} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable columns={columns} data={data.data} filename="engagement_metrics" />
    </div>
  );
}