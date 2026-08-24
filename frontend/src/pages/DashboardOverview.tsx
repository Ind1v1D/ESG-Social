import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useFilters } from '../context/FilterContext';
import { useExport } from '../context/ExportContext';
import { api } from '../api';
import { KpiCard } from '../components/KpiCard';
import { ChartCard } from '../components/ChartCard';
import { PageSkeleton } from '../components/SkeletonLoader';
import { GenderIcon, EngagementIcon, VolunteeringIcon, CoursesIcon, DashboardIcon } from '../components/Icons';
import { exportToCSV, exportToPNG, exportToPDF } from '../utils/exportUtils';
import { useChartTheme } from '../utils/chartTheme';
import { useChartColors } from '../utils/chartColors';

export function DashboardOverview() {
  const { t } = useTranslation();
  const { selectedYear, selectedFaculty, refreshVersion } = useFilters();
  const { registerHandlers, clearHandlers } = useExport();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ct = useChartTheme();
  const colors = useChartColors();

  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ summary, selectedYear, selectedFaculty, t });
  stateRef.current = { summary, selectedYear, selectedFaculty, t };

  useEffect(() => {
    setLoading(true);
    api.getSummary(selectedYear, selectedFaculty)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedFaculty, refreshVersion]);

  useEffect(() => {
    registerHandlers({
      csv: () => {
        const { summary: s, selectedYear: yr, t: tr } = stateRef.current;
        if (!s) return;
        const cols = [
          { key: 'metric', label: tr('metric') },
          { key: 'value', label: tr('value') },
        ];
        const rows = [
          { metric: tr('kpi_female_representation'), value: `${s.gender.avg_female_pct}%` },
          { metric: tr('kpi_satisfaction'), value: `${s.engagement.avg_satisfaction_pct}%` },
          { metric: tr('kpi_volunteers'), value: s.volunteering.total_volunteers },
          { metric: tr('kpi_esg_courses'), value: s.esg_courses.total_courses },
        ];
        exportToCSV(cols, rows, `overview-${yr || 'all'}`);
      },
      png: async () => {
        if (!pageRef.current) return;
        await exportToPNG(pageRef.current, `dashboard-overview-${stateRef.current.selectedYear || 'all'}.png`);
      },
      pdf: async () => {
        const { summary: s, selectedYear: yr, selectedFaculty: fac, t: tr } = stateRef.current;
        if (!s) return;
        const sections: { title: string; element: HTMLElement }[] = [];
        if (chartRef1.current) sections.push({ title: tr('chart_gender_distribution'), element: chartRef1.current });
        if (chartRef2.current) sections.push({ title: tr('chart_key_metrics'), element: chartRef2.current });
        await exportToPDF({
          title: tr('report_title'),
          subtitle: tr('dashboard_description'),
          year: yr, faculty: fac, generatedAt: new Date().toLocaleString(),
          kpis: [
            { label: tr('kpi_female_representation'), value: `${s.gender.avg_female_pct}%` },
            { label: tr('kpi_satisfaction'), value: `${s.engagement.avg_satisfaction_pct}%` },
            { label: tr('kpi_volunteers'), value: String(s.volunteering.total_volunteers) },
            { label: tr('kpi_esg_courses'), value: String(s.esg_courses.total_courses) },
          ],
          sections,
          t: tr,
        });
      },
    });
    return () => clearHandlers();
  }, [registerHandlers, clearHandlers]);

  if (loading) return <PageSkeleton />;

  if (!summary || (
    !summary.gender?.records && !summary.engagement?.records &&
    !summary.volunteering?.records && !summary.esg_courses?.records
  ))
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] mb-4">
          <DashboardIcon size={22} />
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--text)]">{t('no_data_title')}</h3>
        <p className="text-[12px] text-[var(--text-muted)] mt-1 max-w-xs">{t('no_data_description')}</p>
      </div>
    );

  const genderChartData = [
    { name: t('female'), value: summary.gender.avg_female_pct },
    { name: t('male'), value: summary.gender.avg_male_pct },
  ];

  const overviewBars = [
    { name: t('satisfaction'), value: summary.engagement.avg_satisfaction_pct, fill: colors.primary },
    { name: t('women_leadership'), value: summary.gender.avg_women_leadership_pct || 0, fill: colors.secondary },
    { name: t('esg_coverage'), value: summary.esg_courses.avg_esg_students_pct || 0, fill: colors.accent },
  ];

  return (
    <div ref={pageRef} className="w-full min-w-0 space-y-6">
      {/* Hero Section */}
      <div className="card p-7 stagger-child">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-[var(--text-heading)] mb-2.5" style={{ fontFamily: 'var(--font-display)' }}>
              {t('hero_title')}
            </h1>
            <p className="text-[14px] text-[var(--text-muted)] leading-relaxed max-w-xl" style={{ fontFamily: 'var(--font-body)' }}>
              {t('hero_description')}
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[var(--accent)]" style={{ fontFamily: 'var(--font-display)' }}>{summary.gender?.records || 0}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-ui)' }}>{t('hero_stat_faculties')}</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[var(--info)]" style={{ fontFamily: 'var(--font-display)' }}>
                {(summary.gender?.records || 0) + (summary.engagement?.records || 0) + (summary.volunteering?.records || 0) + (summary.esg_courses?.records || 0)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-ui)' }}>{t('hero_stat_metrics')}</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[var(--warning)]" style={{ fontFamily: 'var(--font-display)' }}>
                {new Set(Object.values([summary.gender?.records, summary.engagement?.records]).filter(Boolean)).size || 1}+
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]" style={{ fontFamily: 'var(--font-ui)' }}>{t('hero_stat_years')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stagger-child" style={{ animationDelay: '60ms' }}>
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('dashboard_overview')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('dashboard_description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full min-w-0">
        <KpiCard title={t('kpi_female_representation')} value={`${summary.gender.avg_female_pct}%`} subtitle={`${summary.gender.records} ${t('records')}`} icon={<GenderIcon size={20} />} color="teal" delay={0} />
        <KpiCard title={t('kpi_satisfaction')} value={`${summary.engagement.avg_satisfaction_pct}%`} subtitle={summary.engagement.avg_nps != null ? `NPS: ${summary.engagement.avg_nps}` : undefined} icon={<EngagementIcon size={20} />} color="indigo" delay={80} />
        <KpiCard title={t('kpi_volunteers')} value={summary.volunteering.total_volunteers.toLocaleString()} subtitle={`${summary.volunteering.total_hours.toLocaleString()} ${t('hours')}`} icon={<VolunteeringIcon size={20} />} color="green" delay={160} />
        <KpiCard title={t('kpi_esg_courses')} value={summary.esg_courses.total_courses} subtitle={summary.esg_courses.avg_esg_students_pct != null ? `${summary.esg_courses.avg_esg_students_pct}% ${t('coverage')}` : undefined} icon={<CoursesIcon size={20} />} color="amber" delay={240} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full min-w-0 overflow-hidden">
        <ChartCard ref={chartRef1} title={t('chart_gender_distribution')} exportFilename="gender-distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {genderChartData.map((_, i) => <Cell key={i} fill={colors.all[i]} />)}
              </Pie>
              <Tooltip contentStyle={ct.tooltip} />
              <Legend wrapperStyle={ct.legend} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard ref={chartRef2} title={t('chart_key_metrics')} exportFilename="key-metrics">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewBars} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={ct.axisTick} axisLine={ct.axisLine} />
              <YAxis type="category" dataKey="name" tick={ct.axisTick} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ct.tooltip} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
              <Bar dataKey="value" radius={ct.barRadius} barSize={26}>
                {overviewBars.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}