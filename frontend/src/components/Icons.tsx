import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps): IconProps {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
}

export const LogoIcon = ({ size = 36, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <rect width="36" height="36" rx="10" fill="var(--accent)" />
    <path d="M18 7C11.5 7 7 13.5 9.3 20.5c1.1 3.4 4.5 5.7 8.7 9.2 4.2-3.5 7.6-5.8 8.7-9.2C29 13.5 24.5 7 18 7z" fill="#fff" opacity="0.95" />
    <path d="M18 11v13M13.5 17.5c2.3-2.5 6.7-2.5 9 0" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const DashboardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const GenderIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="10" r="6" />
    <circle cx="16" cy="10" r="6" />
    <path d="M8 10v7M16 10v7" />
  </svg>
);

export const EngagementIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <path d="M7 8l3 3M14 8l3 3" />
  </svg>
);

export const VolunteeringIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="15" r="5.5" />
    <circle cx="15" cy="15" r="5.5" />
    <path d="M9 15.5l3 3.5 3-7 3 3.5-3" />
  </svg>
);

export const CoursesIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19.5C4 6 6 6 22 6H19.5" />
    <path d="M2 3l14 14 6 0M2 21l14.5 8.5 5.5 0" />
  </svg>
);

export const MethodologyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3h7c1-0.8 2-0.8 2-1 0.5-1 0.5-2 0.5-3.7" />
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M4 8h16M4 12h9" />
  </svg>
);

export const AdminIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11a5 5 0 0 1" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth="1.5">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 4v1.5M12 18.5v1.5M4.5 6.5l1.6-1.6M19.5 17.5l1.6 1.6M12 6h2.2M11 21h2.2M4.8 15.5l-1.6-1.6M19.2 8.5l1.6 1.6" />
  </svg>
);

export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12.8A21 12.8Q.4 3.7-5.5-4.1C-16.5 0h" />
  </svg>
);

export const ExportIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 3v2M12 3v19M7 15v2" />
    <path d="M3 17h3" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 19l-5.5-5.5 5.5-5.5" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6l-12 12" />
  </svg>
);

export const CameraIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="11" rx="2" />
    <circle cx="6" cy="10" r="1" fill="currentColor" />
    <path d="M15 8v6h3" />
  </svg>
);

export const GlobeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4v16M4 12h16" strokeWidth="1.2" />
    <path d="M5 19.5 3.5 16 2.5 12.5.5 8.5" strokeWidth="1.2" />
    <path d="M19 19.5-3.5 16-2.5 12.5-.5 8.5" strokeWidth="1.2" />
  </svg>
);

export const FilterIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);