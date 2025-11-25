import React from 'react';

interface NeonLogoProps {
  className?: string;
  animate?: boolean;
}

export const NeonLogo: React.FC<NeonLogoProps> = ({ className = "w-12 h-12", animate = false }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Glow Effect Layer */}
      <svg 
        viewBox="0 0 100 100" 
        className={`absolute inset-0 w-full h-full text-neon-pink blur-md opacity-60 ${animate ? 'animate-pulse' : ''}`}
        fill="currentColor"
      >
         <path d="M10 20 L40 20 L50 30 L90 30 L90 80 L10 80 Z" />
      </svg>

      {/* Main Sharp Layer */}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ff6ac1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#00FFFF', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Clapperboard Body / Main Frame */}
        <path 
            d="M15 25 L42 25 L52 35 L85 35 L85 75 L15 75 Z" 
            fill="none" 
            stroke="url(#grad1)" 
            strokeWidth="3"
            strokeLinejoin="round"
        />
        
        {/* Clapperboard Stripes / Data Lines */}
        <path d="M25 25 L15 40" stroke="#00FFFF" strokeWidth="2" />
        <path d="M40 25 L30 40" stroke="#00FFFF" strokeWidth="2" />
        <path d="M55 35 L45 50" stroke="#ff6ac1" strokeWidth="2" />

        {/* Play Button / Chip Center */}
        <path d="M45 50 L60 58 L45 66 Z" fill="#00FFFF" />

        {/* Tech Decorators */}
        <rect x="15" y="80" width="10" height="2" fill="#ff6ac1" />
        <rect x="30" y="80" width="30" height="2" fill="#ff6ac1" opacity="0.5" />
        <rect x="85" y="20" width="2" height="10" fill="#00FFFF" />
      </svg>
    </div>
  );
};