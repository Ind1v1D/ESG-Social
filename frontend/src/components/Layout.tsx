import { useState, useCallback, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSSE } from '../hooks/useSSE';
import { useTheme } from '../context/ThemeContext';
import { FilterBar } from './FilterBar';
import {
  DashboardIcon, GenderIcon, EngagementIcon, VolunteeringIcon,
  CoursesIcon, MethodologyIcon, AdminIcon, SunIcon, MoonIcon,
  MenuIcon, CloseIcon, LogoIcon, ChevronLeftIcon,
} from './Icons';

const SIDEBAR_KEY = 'esg_sidebar_collapsed';

export function Layout() {
  useSSE();
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== 'false'; } catch { return true; }
  });
  const [hovered, setHovered] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_KEY, String(collapsed)); } catch {}
  }, [collapsed]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const NAV = [
    { to: '/dashboard', label: t('overview'), Icon: DashboardIcon },
    { to: '/dashboard/gender', label: t('gender'), Icon: GenderIcon },
    { to: '/dashboard/engagement', label: t('engagement'), Icon: EngagementIcon },
    { to: '/dashboard/volunteering', label: t('volunteering'), Icon: VolunteeringIcon },
    { to: '/dashboard/esg-courses', label: t('courses'), Icon: CoursesIcon },
    { to: '/methodology', label: t('methodology'), Icon: MethodologyIcon },
  ];

  const navLink = (n: typeof NAV[number]) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.to === '/dashboard'}
      onClick={closeMobile}
      title={!sidebarExpanded ? n.label : undefined}
      className={({ isActive }) =>
        `nav-item relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
          !sidebarExpanded ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
        } ${
          isActive
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && sidebarExpanded && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[50%] rounded-r bg-[var(--accent)]" />}
          <n.Icon size={18} />
          {sidebarExpanded && <span>{n.label}</span>}
        </>
      )}
    </NavLink>
  );

  const sidebarWidth = collapsed && !hovered ? 56 : 224;
  const sidebarExpanded = collapsed ? hovered : true;

  const sidebarInner = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center ${!sidebarExpanded ? 'justify-center px-2 pt-5 pb-3' : 'px-4 pt-5 pb-3'}`}>
        <div className="brand-logo shrink-0">
          <LogoIcon size={!sidebarExpanded ? 28 : 26} />
        </div>
        {sidebarExpanded && (
          <div className="ml-2.5 min-w-0">
            <h1 className="text-[13px] font-bold text-[var(--text-heading)] leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>{t('app_title')}</h1>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">{t('dashboard')}</p>
          </div>
        )}
      </div>

      {sidebarExpanded && <div className="accent-gradient-bar mx-4" />}

      {/* Navigation */}
      <nav className={`flex flex-col gap-0.5 flex-1 ${!sidebarExpanded ? 'px-2 mt-3' : 'px-3 mt-3'}`}>
        {sidebarExpanded && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-1">{t('analytics')}</p>
        )}
        {NAV.map(navLink)}

        <div className={`border-t border-[var(--border)] ${!sidebarExpanded ? 'my-2 mx-1' : 'my-3 mx-2'}`} />
        {sidebarExpanded && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 mb-1">{t('management')}</p>
        )}
        <NavLink
          to="/admin"
          onClick={closeMobile}
          title={!sidebarExpanded ? t('admin_panel') : undefined}
          className={({ isActive }) =>
            `nav-item relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150 ${
              !sidebarExpanded ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
            } ${
              isActive
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && sidebarExpanded && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[50%] rounded-r bg-[var(--accent)]" />}
              <AdminIcon size={18} />
              {sidebarExpanded && <span>{t('admin_panel')}</span>}
            </>
          )}
        </NavLink>
      </nav>

      {/* Theme toggle + collapse */}
      <div className={`${!sidebarExpanded ? 'px-2 pb-4' : 'px-4 pb-4'} border-t border-[var(--border)] pt-3 space-y-1`}>
        <button
          onClick={toggle}
          className={`theme-toggle flex items-center gap-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer focus-ring rounded-lg ${
            !sidebarExpanded ? 'justify-center px-2 py-2 w-full' : 'px-2 py-1.5'
          }`}
          aria-label={t('toggle_theme')}
          title={!sidebarExpanded ? (theme === 'light' ? t('dark_mode') : t('light_mode')) : undefined}
        >
          {theme === 'light' ? <MoonIcon size={15} /> : <SunIcon size={15} />}
          {sidebarExpanded && <span className="font-medium">{theme === 'light' ? t('dark_mode') : t('light_mode')}</span>}
        </button>
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`hidden lg:flex items-center gap-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer focus-ring rounded-lg ${
            !sidebarExpanded ? 'justify-center px-2 py-2 w-full' : 'px-2 py-1.5'
          }`}
          aria-label="Toggle sidebar"
          title={!sidebarExpanded ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeftIcon size={15} className={`transition-transform duration-200 ${!sidebarExpanded ? 'rotate-180' : ''}`} />
          {sidebarExpanded && <span className="font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col sticky top-0 h-screen overflow-y-auto border-r border-[var(--border)] sidebar-transition"
        style={{ width: sidebarWidth, minWidth: sidebarWidth, zIndex: collapsed && hovered ? 50 : 'auto' }}
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => collapsed && setHovered(false)}
      >
        {sidebarInner}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay fixed inset-0 lg:hidden" onClick={closeMobile} />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] transform transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={closeMobile} className="absolute top-4 right-3 p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] focus-ring cursor-pointer">
          <CloseIcon size={16} />
        </button>
        {sidebarInner}
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 lg:hidden border-b border-[var(--border)] bg-[var(--bg-card)]">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] focus-ring cursor-pointer">
            <MenuIcon size={18} />
          </button>
          <LogoIcon size={20} />
          <span className="text-[13px] font-semibold text-[var(--text)]">{t('app_title')}</span>
          <div className="flex-1" />
          <button onClick={toggle} className="theme-toggle p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] focus-ring cursor-pointer">
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>
        </div>

        <FilterBar />
        <main className="flex-1 w-full px-4 py-5 lg:px-6 lg:py-5 overflow-x-hidden">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}