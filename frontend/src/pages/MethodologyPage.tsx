import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DashboardIcon, GenderIcon, EngagementIcon, VolunteeringIcon,
  CoursesIcon, MethodologyIcon, AdminIcon, SunIcon, MoonIcon,
  ChevronDownIcon, CloseIcon,
} from '../components/Icons';

const STEP_COLORS = [
  'step-dot-teal', 'step-dot-blue', 'step-dot-orange', 'step-dot-purple',
  'step-dot-rose', 'step-dot-amber', 'step-dot-emerald', 'step-dot-cyan', 'step-dot-slate',
];

const STEP_ICONS = [
  MethodologyIcon, CoursesIcon, AdminIcon, GenderIcon,
  EngagementIcon, VolunteeringIcon, DashboardIcon, MoonIcon, SunIcon,
];

interface StepData {
  titleKey: string;
  descKey: string;
  purposeKey: string;
  inputsKey: string;
  outputsKey: string;
  responsibleKey: string;
  durationKey: string;
  toolsKey: string;
  criteriaKey: string;
  color: string;
  Icon: React.FC<any>;
}

export function MethodologyPage() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const steps: StepData[] = Array.from({ length: 9 }, (_, i) => ({
    titleKey: `method_step_${i + 1}_title`,
    descKey: `method_step_${i + 1}_desc`,
    purposeKey: `method_step_${i + 1}_purpose`,
    inputsKey: `method_step_${i + 1}_inputs`,
    outputsKey: `method_step_${i + 1}_outputs`,
    responsibleKey: `method_step_${i + 1}_responsible`,
    durationKey: `method_step_${i + 1}_duration`,
    toolsKey: `method_step_${i + 1}_tools`,
    criteriaKey: `method_step_${i + 1}_criteria`,
    color: STEP_COLORS[i],
    Icon: STEP_ICONS[i],
  }));

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="stagger-child">
        <h2 className="text-xl font-bold text-[var(--text-heading)]" style={{ fontFamily: 'var(--font-display)' }}>{t('methodology_title')}</h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{t('methodology_subtitle')}</p>
      </div>

      <div className="relative">
        {Array.from({ length: 3 }).map((_, row) => (
          <div key={row} className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {steps.slice(row * 3, row * 3 + 3).map((step, colIdx) => {
                const stepIdx = row * 3 + colIdx;
                const isOpen = expanded.has(stepIdx);
                return (
                  <div key={stepIdx} className="relative">
                    {/* Connector lines */}
                    {colIdx < 2 && (
                      <div className="hidden md:block absolute top-10 right-0 w-4 h-[1px] bg-[var(--border)] z-10" style={{ transform: 'translateX(50%)' }} />
                    )}
                    {colIdx === 2 && row < 2 && (
                      <div className="hidden md:block absolute top-full right-10 w-[1px] h-4 bg-[var(--border)] z-10" />
                    )}
                    {colIdx < 2 && row < 2 && (
                      <div className="hidden md:block absolute top-full w-[1px] h-4 bg-[var(--border)] z-10" style={{ left: colIdx === 0 ? '75%' : '25%' }} />
                    )}

                    {/* Step Card */}
                    <div className={`method-step w-full bg-[var(--bg-card)] border rounded-xl overflow-hidden flex flex-col ${isOpen ? 'active' : 'border-[var(--border)]'}`}>
                      <button
                        onClick={() => toggle(stepIdx)}
                        className="w-full text-left p-5"
                      >
                        <div className="flex justify-center mb-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold ${step.color}`}>
                            {stepIdx + 1}
                          </div>
                        </div>
                        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-heading)] text-center mb-1.5" style={{ fontFamily: 'var(--font-ui)' }}>
                          {t(step.titleKey)}
                        </h3>
                        <p className="text-[12px] text-[var(--text-muted)] text-center leading-relaxed line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                          {t(step.descKey)}
                        </p>
                        <div className="flex justify-center mt-3">
                          <ChevronDownIcon
                            size={14}
                            className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      {/* Detail Drawer — animated, multi-expand */}
                      <div
                        className={`overflow-hidden transition-all duration-250 ease-out mt-auto ${
                          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-5 pb-5 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between pt-3 mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]" style={{ fontFamily: 'var(--font-ui)' }}>
                              Phase Details
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggle(stepIdx); }}
                              className="p-1 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer"
                            >
                              <CloseIcon size={12} />
                            </button>
                          </div>

                          {/* Purpose */}
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Purpose</p>
                            <p className="text-[12px] text-[var(--text)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{t(step.purposeKey)}</p>
                          </div>

                          {/* 2-column grid: Inputs / Outputs */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--info)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Inputs</p>
                              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{t(step.inputsKey)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--info)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Outputs</p>
                              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{t(step.outputsKey)}</p>
                            </div>
                          </div>

                          {/* 3-column grid: Responsible / Duration / Tools */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Responsible</p>
                              <p className="text-[11px] text-[var(--text)]" style={{ fontFamily: 'var(--font-body)' }}>{t(step.responsibleKey)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Duration</p>
                              <p className="text-[11px] text-[var(--text)]" style={{ fontFamily: 'var(--font-body)' }}>{t(step.durationKey)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1" style={{ fontFamily: 'var(--font-ui)' }}>Tools</p>
                              <p className="text-[11px] text-[var(--text)]" style={{ fontFamily: 'var(--font-body)' }}>{t(step.toolsKey)}</p>
                            </div>
                          </div>

                          {/* Success Criteria */}
                          <div className="bg-[var(--accent-soft)] rounded-lg px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-0.5" style={{ fontFamily: 'var(--font-ui)' }}>Success Criteria</p>
                            <p className="text-[11px] text-[var(--text)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{t(step.criteriaKey)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}