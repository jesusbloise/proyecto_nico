import React from 'react';
import { NeonTooltip } from './NeonTooltip';

interface NeonInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  tooltip?: string;
  type?: string;
}

export const NeonInput: React.FC<NeonInputProps> = ({ id, label, value, onChange, tooltip, type = 'text' }) => {
  const labelEl = (
    <label htmlFor={id} className="block text-neon-pink font-retro text-[10px] md:text-xs mb-1 cursor-help truncate">
      {label}
    </label>
  );

  return (
    <div className="mb-4">
      {tooltip ? (
        <NeonTooltip content={tooltip} align="left">
          {labelEl}
        </NeonTooltip>
      ) : (
        labelEl
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border border-neon-pink/50 text-neon-cyan font-code p-2 rounded focus:border-neon-pink focus:shadow-neon-pink focus:outline-none transition-all placeholder-neon-cyan/30"
        placeholder={`ENTER ${label}...`}
      />
    </div>
  );
};