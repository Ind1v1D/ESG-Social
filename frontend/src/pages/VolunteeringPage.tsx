import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFilters } from '../context/FilterContext';
import { useExport } from '../context/ExportContext';
import { api } from '../api';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { DataTable } from '../components/DataTable';
import { PageSkeleton } from '../components/SkeletonLoader';
import { VolunteeringIcon } from '../components/Icons';
import { exportToCSV, exportToPNG, exportToPDF } from '../utils/exportUtils';
import { useChartTheme } from '../utils/chartTheme';
import { useChartColors } from '../utils/chartColors';

const COLUMNS = [
  { key: 'year', label: 'col_year' }, { key: 'faculty', label: 'col_faculty' },
  { key: 'volunteers_students', label: 'col_student_volunteers' }, { key: 'volunteers_staff', label: 'col_staff_volunteers' },
  { key: 'total_hours', label: 'col_total_hours' }, { key: 'projects_count', label: 'col_projects' },
  { key: 'top_direction', label: 'col_top_direction' },
];

export function VolunteeringPage() {
  const { t } = useTranslation();
  const { selectedYear, selectedFaculty, refreshVersion } = useFilters();
  const { registerHandlers, clearHandlers } = useExport();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ct = useChartTheme();
  const chartColors = useChartColors();

  const chartRef1 = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ data, selectedYear, selectedFaculty, t });
  stateRef.current = { data, selectedYear, selectedFaculty, t };

  useEffect(() => {
    setLoading(true);
    api.getVolunteering(selectedYear, selectedFaculty).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [selectedYear, selectedFaculty, refreshVersion]);

  useEffect(() => {
    registerHandlers({
      csv: () => {
        const { data: d, selectedYear: yr, t: tr } = stateRef.current;
        if (!d?.data) return;
        exportToCSV(COLUMNS.map(c => ({ key: c.key, label: tr(c.label) })), d.data, `volunteering-metrics-${yr || 'all'}`);
      },
      png: async () => { if (pageRef.current) await exportToPNG(pageRef.current, `volunteering-report-${stateRef.current.selectedYear || 'all'}.png`); },
      pdf: async () => {
        const { data: d, selectedYear: yr, selectedFaculty: fac, t: tr } = stateRef.current;
        if (!d) return;
        const sections: { title: string; element: HTMLElement }[] = [];
        if (chartRef1.current) sections.push({ title: tr('chart_volunteer_hours'), element: chartRef1.current });
        await exportToPDF({ title: `${tr('report_title')} — ${tr('volunteering')}`, subtitle: tr('volunteering_page_subtitle'), year: yr, faculty: fac, generatedAt: new Date().toLocaleString(),
          kpis: [{ label: tr('kpi_volunteers'), value: String(d.summary.total_volunteers) }, { label: tr('kpi_total_hours'), value: String(d.summary.total_hours) },
            { label: tr('kpi_projects'), value: String(d.summary.total_projects) }], sections, t: tr });
      },
    });
    return () => clearHandlers();
  }, [registerHandlers, clearHandlers]);

  if (loading) return <PageSkeleton />;
  if (!data?.data?.length)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] w-full">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4"><VolunteeringIcon size={22} /></div>
        <h3 className="text-[15px] font-semibold text-[var(--text)]">{t('no_volunteering_data')}</h3>
      </div>
    );

  const studentsLabel = t('students'), staffLabel = t('staff');
  const byFaculty = Object.values(data.data.reduce((acc: any, r: any) => {
    if (!acc[r.faculty]) acc[r.faculty] = { faculty: r.faculty, students: 0, staff: 0 };
    acc[r.faculty].students += r.volunteers_students; acc[r.faculty].staff += r.volunteers_staff;
    return acc;
  }, {})).map((f: any) => ({
    faculty: f.faculty.length > 15 ? f.faculty.substring(0, 15) + '…' : f.faculty,
    [studentsLabel]: f.students, [staffLabel]: f.staff,
  }));
  const columns = COLUMNS.map(c => ({ key: c.key, label: t(c.label) }));

  return (
    <div ref={pageRef} className="w-full min-w-0 space-y-6">
      <div className="stagger-child">
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('volunteering_page_title')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('volunteering_page_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
        <KpiCard title={t('kpi_volunteers')} value={data.summary.total_volunteers.toLocaleString()} icon={<VolunteeringIcon size={20} />} color="teal" />
        <KpiCard title={t('kpi_total_hours')} value={data.summary.total_hours.toLocaleString()} icon={<VolunteeringIcon size={20} />} color="indigo" delay={80} />
        <KpiCard title={t('kpi_projects')} value={data.summary.total_projects} icon={<VolunteeringIcon size={20} />} color="green" delay={160} />
      </div>
      <div className="w-full min-w-0 overflow-hidden">
        <ChartCard ref={chartRef1} title={t('chart_volunteer_hours')} exportFilename="volunteering-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byFaculty}>
              <XAxis dataKey="faculty" tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis tick={ct.axisTick} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
              <Legend wrapperStyle={ct.legend} />
              <Bar dataKey={studentsLabel} fill={chartColors.primary} radius={ct.barRadius} barSize={30} />
              <Bar dataKey={staffLabel} fill={chartColors.secondary} radius={ct.barRadius} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <DataTable columns={columns} data={data.data} filename="volunteering_metrics" />
    </div>
  );
}