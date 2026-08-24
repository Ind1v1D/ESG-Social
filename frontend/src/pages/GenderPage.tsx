import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useFilters } from '../context/FilterContext';
import { useExport } from '../context/ExportContext';
import { api } from '../api';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { DataTable } from '../components/DataTable';
import { PageSkeleton } from '../components/SkeletonLoader';
import { GenderIcon } from '../components/Icons';
import { exportToCSV, exportToPNG, exportToPDF } from '../utils/exportUtils';
import { useChartTheme } from '../utils/chartTheme';
import { useChartColors } from '../utils/chartColors';

const COLUMNS = [
  { key: 'year', label: 'col_year' }, { key: 'faculty', label: 'col_faculty' },
  { key: 'group_type', label: 'col_group' }, { key: 'male_pct', label: 'col_male_pct' },
  { key: 'female_pct', label: 'col_female_pct' }, { key: 'other_pct', label: 'col_other_pct' },
  { key: 'women_leadership_pct', label: 'col_women_leadership_pct' }, { key: 'pay_gap_pct', label: 'col_pay_gap_pct' },
];

export function GenderPage() {
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
    api.getGender(selectedYear, selectedFaculty).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [selectedYear, selectedFaculty, refreshVersion]);

  useEffect(() => {
    registerHandlers({
      csv: () => {
        const { data: d, selectedYear: yr, t: tr } = stateRef.current;
        if (!d?.data) return;
        exportToCSV(COLUMNS.map(c => ({ key: c.key, label: tr(c.label) })), d.data, `gender-metrics-${yr || 'all'}`);
      },
      png: async () => { if (pageRef.current) await exportToPNG(pageRef.current, `gender-report-${stateRef.current.selectedYear || 'all'}.png`); },
      pdf: async () => {
        const { data: d, selectedYear: yr, selectedFaculty: fac, t: tr } = stateRef.current;
        if (!d) return;
        const sections: { title: string; element: HTMLElement }[] = [];
        if (chartRef1.current) sections.push({ title: tr('chart_gender_balance'), element: chartRef1.current });
        if (chartRef2.current) sections.push({ title: tr('chart_overall_gender_split'), element: chartRef2.current });
        await exportToPDF({ title: `${tr('report_title')} — ${tr('gender')}`, subtitle: tr('gender_page_subtitle'), year: yr, faculty: fac, generatedAt: new Date().toLocaleString(),
          kpis: [{ label: tr('kpi_avg_female_pct'), value: `${d.summary.avg_female_pct}%` }, { label: tr('kpi_avg_male_pct'), value: `${d.summary.avg_male_pct}%` },
            { label: tr('kpi_women_leadership'), value: d.summary.avg_women_leadership_pct != null ? `${d.summary.avg_women_leadership_pct}%` : 'N/A' }], sections, t: tr });
      },
    });
    return () => clearHandlers();
  }, [registerHandlers, clearHandlers]);

  if (loading) return <PageSkeleton />;
  if (!data?.data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4"><GenderIcon size={22} /></div>
        <h3 className="text-[15px] font-semibold text-[var(--text)]">{t('no_gender_data')}</h3>
      </div>
    );

  const byFaculty: Record<string, { faculty: string; male: number; female: number; count: number }> = {};
  data.data.forEach((r: any) => {
    if (!byFaculty[r.faculty]) byFaculty[r.faculty] = { faculty: r.faculty, male: 0, female: 0, count: 0 };
    byFaculty[r.faculty].male += r.male_pct; byFaculty[r.faculty].female += r.female_pct; byFaculty[r.faculty].count += 1;
  });
  const femaleLabel = t('female'), maleLabel = t('male');
  const barData = Object.values(byFaculty).map(f => ({
    faculty: f.faculty.length > 15 ? f.faculty.substring(0, 15) + '…' : f.faculty,
    [maleLabel]: Math.round(f.male / f.count * 10) / 10, [femaleLabel]: Math.round(f.female / f.count * 10) / 10,
  }));
  const pieData = [{ name: t('female'), value: data.summary.avg_female_pct }, { name: t('male'), value: data.summary.avg_male_pct }];
  const columns = COLUMNS.map(c => ({ key: c.key, label: t(c.label) }));

  return (
    <div ref={pageRef} className="w-full min-w-0 space-y-6">
      <div className="stagger-child">
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('gender_page_title')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('gender_page_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
        <KpiCard title={t('kpi_avg_female_pct')} value={`${data.summary.avg_female_pct}%`} icon={<GenderIcon size={20} />} color="teal" />
        <KpiCard title={t('kpi_avg_male_pct')} value={`${data.summary.avg_male_pct}%`} icon={<GenderIcon size={20} />} color="indigo" delay={80} />
        <KpiCard title={t('kpi_women_leadership')} value={data.summary.avg_women_leadership_pct != null ? `${data.summary.avg_women_leadership_pct}%` : 'N/A'} icon={<GenderIcon size={20} />} color="amber" delay={160} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0 overflow-hidden">
        <ChartCard ref={chartRef1} title={t('chart_gender_balance')} exportFilename="gender-balance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="faculty" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis domain={[0, 100]} tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
              <Legend wrapperStyle={ct.legend} />
              <Bar dataKey={femaleLabel} fill={chartColors.primary} radius={ct.barRadius} barSize={26} />
              <Bar dataKey={maleLabel} fill={chartColors.secondary} radius={ct.barRadius} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard ref={chartRef2} title={t('chart_overall_gender_split')} exportFilename="gender-split">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={chartColors.all[i]} />)}
              </Pie>
              <Tooltip contentStyle={ct.tooltip} />
              <Legend wrapperStyle={ct.legend} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable columns={columns} data={data.data} filename="gender_metrics" />
    </div>
  );
}