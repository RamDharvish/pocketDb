import React from 'react';

interface PocketDbLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'icon-only' | 'with-wordmark' | 'vertical-wordmark' | 'splash';
  className?: string;
  animate?: boolean;
}

export const PocketDbLogo: React.FC<PocketDbLogoProps> = ({
  size = 'md',
  variant = 'icon-only',
  className = '',
  animate = false,
}) => {
  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 20;
      case 'sm':
        return 28;
      case 'md':
        return 38;
      case 'lg':
        return 48;
      case 'xl':
        return 72;
      case '2xl':
        return 96;
      default:
        return 38;
    }
  };

  const dim = getDimension();

  // Distinctive PocketDB Geometric Mark:
  // Combines a sleek pocket container silhouette with 3 structured database platters,
  // terminal ledger notches, and cryptographic ownership geometry.
  const renderSvgMark = (width: number, height: number) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${animate ? 'animate-pulse' : ''}`}
    >
      <defs>
        {/* Outer Pocket Gradient */}
        <linearGradient id="pocketBorderGrad" x1="10" y1="10" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Pocket Body Dark Obsidian Gradient */}
        <linearGradient id="pocketBodyGrad" x1="20" y1="15" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Database Top Platter Gradient (Cyan / Blue) */}
        <linearGradient id="dbTopGrad" x1="28" y1="26" x2="72" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>

        {/* Database Mid Platter Gradient */}
        <linearGradient id="dbMidGrad" x1="28" y1="46" x2="72" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Database Base Platter Gradient (Emerald / Slate) */}
        <linearGradient id="dbBaseGrad" x1="28" y1="64" x2="72" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Shadow Glow Filter */}
        <filter id="pocketGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3B82F6" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Pocket Outer Contour: Tailored Chamfered Shield Profile */}
      <path
        d="M 22 18 
           C 22 18, 50 14, 78 18 
           C 82 18.5, 85 21.5, 85 25.5 
           L 85 58 
           C 85 75, 68 88, 50 91 
           C 32 88, 15 75, 15 58 
           L 15 25.5 
           C 15 21.5, 18 18.5, 22 18 Z"
        fill="url(#pocketBodyGrad)"
        stroke="url(#pocketBorderGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        filter="url(#pocketGlow)"
      />

      {/* Top Pocket Stitch / Seam Geometry (Developer Grid Accent) */}
      <path
        d="M 23 28 C 36 25, 64 25, 77 28"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* --- DATABASE PLATTER 1 (TOP TIER: P-NOTCH & CYAN VAULT) --- */}
      <g>
        {/* Platter Cylinder Base */}
        <path
          d="M 30 35 C 30 31.5, 40 29, 50 29 C 60 29, 70 31.5, 70 35 L 70 41 C 70 44.5, 60 47, 50 47 C 40 47, 30 44.5, 30 41 Z"
          fill="url(#dbTopGrad)"
        />
        {/* Platter Top Ellipse */}
        <ellipse cx="50" cy="35" rx="20" ry="6" fill="#67E8F9" opacity="0.9" />
        {/* Platter Inner Core (Stylized P Notch) */}
        <circle cx="50" cy="35" r="2.5" fill="#0E7490" />
        {/* Right Status LED Dot */}
        <circle cx="63" cy="37" r="1.5" fill="#FFFFFF" />
      </g>

      {/* --- DATABASE PLATTER 2 (MID TIER: COBALT LEDGER) --- */}
      <g>
        <path
          d="M 30 49 C 30 46, 40 43.5, 50 43.5 C 60 43.5, 70 46, 70 49 L 70 56 C 70 59.5, 60 62, 50 62 C 40 62, 30 59.5, 30 56 Z"
          fill="url(#dbMidGrad)"
        />
        {/* Platter Top Rim */}
        <ellipse cx="50" cy="49" rx="20" ry="5.5" fill="#93C5FD" opacity="0.8" />
        {/* Dual Terminal Notches */}
        <rect x="42" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
        <rect x="52" y="52" width="6" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
      </g>

      {/* --- DATABASE PLATTER 3 (BASE TIER: EMERALD LOCAL STORAGE) --- */}
      <g>
        <path
          d="M 32 64 C 32 61.5, 41 59, 50 59 C 59 59, 68 61.5, 68 64 L 68 70 C 68 73.5, 59 76, 50 76 C 41 76, 32 73.5, 32 70 Z"
          fill="url(#dbBaseGrad)"
        />
        {/* Platter Top Rim */}
        <ellipse cx="50" cy="64" rx="18" ry="5" fill="#6EE7B7" opacity="0.8" />
        {/* Local Verification Node Indicator */}
        <circle cx="50" cy="68" r="1.75" fill="#FFFFFF" />
      </g>

      {/* Bottom Pocket Reinforcement Rivet */}
      <circle cx="50" cy="84" r="2" fill="#38BDF8" opacity="0.75" />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderSvgMark(dim, dim)}</div>;
  }

  if (variant === 'with-wordmark') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderSvgMark(dim, dim)}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-black tracking-tight text-gray-900 dark:text-white font-mono">
              Pocket<span className="text-blue-600 dark:text-blue-400">DB</span>
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              LOCAL
            </span>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-gray-400 font-medium tracking-tight">
            Private Developer Finance
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'vertical-wordmark' || variant === 'splash') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        {renderSvgMark(dim, dim)}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight font-mono">
              Pocket<span className="text-blue-600 dark:text-blue-400">DB</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              SQLite v1.0
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Your finances. Your device. Your database.
          </p>
        </div>
      </div>
    );
  }

  return renderSvgMark(dim, dim);
};
