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
import { CoursesIcon } from '../components/Icons';
import { exportToCSV, exportToPNG, exportToPDF } from '../utils/exportUtils';
import { useChartTheme } from '../utils/chartTheme';
import { useChartColors } from '../utils/chartColors';

const COLUMNS = [
  { key: 'year', label: 'col_year' }, { key: 'faculty', label: 'col_faculty' },
  { key: 'courses_count', label: 'col_courses' }, { key: 'esg_students_pct', label: 'col_esg_students_pct' },
  { key: 'green_program_students', label: 'col_green_program' },
];

export function EsgCoursesPage() {
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
    api.getEsgCourses(selectedYear, selectedFaculty).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [selectedYear, selectedFaculty, refreshVersion]);

  useEffect(() => {
    registerHandlers({
      csv: () => {
        const { data: d, selectedYear: yr, t: tr } = stateRef.current;
        if (!d?.data) return;
        exportToCSV(COLUMNS.map(c => ({ key: c.key, label: tr(c.label) })), d.data, `esg-courses-metrics-${yr || 'all'}`);
      },
      png: async () => { if (pageRef.current) await exportToPNG(pageRef.current, `esg-courses-report-${stateRef.current.selectedYear || 'all'}.png`); },
      pdf: async () => {
        const { data: d, selectedYear: yr, selectedFaculty: fac, t: tr } = stateRef.current;
        if (!d) return;
        const sections: { title: string; element: HTMLElement }[] = [];
        if (chartRef1.current) sections.push({ title: tr('chart_esg_courses'), element: chartRef1.current });
        if (chartRef2.current) sections.push({ title: tr('chart_courses_trend'), element: chartRef2.current });
        await exportToPDF({ title: `${tr('report_title')} — ${tr('courses')}`, subtitle: tr('esg_courses_page_subtitle'), year: yr, faculty: fac, generatedAt: new Date().toLocaleString(),
          kpis: [{ label: tr('kpi_total_courses'), value: String(d.summary.total_courses) },
            { label: tr('kpi_avg_esg_coverage'), value: d.summary.avg_esg_students_pct != null ? `${d.summary.avg_esg_students_pct}%` : 'N/A' },
            { label: tr('kpi_green_program'), value: String(d.summary.total_green_program_students) }], sections, t: tr });
      },
    });
    return () => clearHandlers();
  }, [registerHandlers, clearHandlers]);

  if (loading) return <PageSkeleton />;
  if (!data?.data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4"><CoursesIcon size={22} /></div>
        <h3 className="text-[15px] font-semibold text-[var(--text)]">{t('no_esg_data')}</h3>
      </div>
    );

  const coursesLabel = t('courses_label'), greenLabel = t('green_students'), totalCoursesLabel = t('total_courses'), avgEsgLabel = t('avg_esg_pct');
  const byFaculty = Object.values(data.data.reduce((acc: any, r: any) => {
    if (!acc[r.faculty]) acc[r.faculty] = { faculty: r.faculty, courses: 0, green: 0 };
    acc[r.faculty].courses += r.courses_count; acc[r.faculty].green += r.green_program_students || 0;
    return acc;
  }, {})).map((f: any) => ({
    faculty: f.faculty.length > 15 ? f.faculty.substring(0, 15) + '…' : f.faculty,
    [coursesLabel]: f.courses, [greenLabel]: f.green,
  }));
  const byYear = Object.values(data.data.reduce((acc: any, r: any) => {
    if (!acc[r.year]) acc[r.year] = { year: r.year, courses: 0, pctSum: 0, pctCount: 0 };
    acc[r.year].courses += r.courses_count;
    if (r.esg_students_pct != null) { acc[r.year].pctSum += r.esg_students_pct; acc[r.year].pctCount += 1; }
    return acc;
  }, {})).map((y: any) => ({ year: y.year, [totalCoursesLabel]: y.courses, [avgEsgLabel]: y.pctCount > 0 ? Math.round(y.pctSum / y.pctCount * 10) / 10 : 0 }))
    .sort((a: any, b: any) => a.year - b.year);
  const columns = COLUMNS.map(c => ({ key: c.key, label: t(c.label) }));

  return (
    <div ref={pageRef} className="w-full min-w-0 space-y-6">
      <div className="stagger-child">
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('esg_courses_page_title')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('esg_courses_page_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
        <KpiCard title={t('kpi_total_courses')} value={data.summary.total_courses} icon={<CoursesIcon size={20} />} color="teal" />
        <KpiCard title={t('kpi_avg_esg_coverage')} value={data.summary.avg_esg_students_pct != null ? `${data.summary.avg_esg_students_pct}%` : 'N/A'} icon={<CoursesIcon size={20} />} color="indigo" delay={80} />
        <KpiCard title={t('kpi_green_program')} value={data.summary.total_green_program_students} icon={<CoursesIcon size={20} />} color="green" delay={160} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0 overflow-hidden">
        <ChartCard ref={chartRef1} title={t('chart_esg_courses')} exportFilename="esg-courses-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byFaculty}>
              <XAxis dataKey="faculty" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
              <Legend wrapperStyle={ct.legend} />
              <Bar dataKey={coursesLabel} fill={chartColors.primary} radius={ct.barRadius} barSize={26} />
              <Bar dataKey={greenLabel} fill={chartColors.secondary} radius={ct.barRadius} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard ref={chartRef2} title={t('chart_courses_trend')} exportFilename="esg-courses-trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={ct.grid.stroke} />
              <XAxis dataKey="year" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} />
              <Legend wrapperStyle={ct.legend} />
              <Line type="monotone" dataKey={totalCoursesLabel} stroke={chartColors.primary} strokeWidth={ct.lineStrokeWidth} dot={ct.dot(chartColors.primary)} />
              <Line type="monotone" dataKey={avgEsgLabel} stroke={chartColors.secondary} strokeWidth={ct.lineStrokeWidth} dot={ct.dot(chartColors.secondary)} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable columns={columns} data={data.data} filename="esg_courses_metrics" />
    </div>
  );
}