import React, { useState } from 'react';

interface NeonTooltipProps {
  content: string;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const NeonTooltip: React.FC<NeonTooltipProps> = ({ content, children, align = 'center', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute bottom-full mb-2 z-50 w-48 p-2 bg-black border border-neon-cyan text-neon-cyan text-xs font-code shadow-neon-cyan pointer-events-none 
          ${align === 'center' ? 'left-1/2 -translate-x-1/2' : ''}
          ${align === 'left' ? 'left-0' : ''}
          ${align === 'right' ? 'right-0' : ''}
        `}>
          {content}
        </div>
      )}
    </div>
  );
};