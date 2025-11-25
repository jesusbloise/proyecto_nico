import React from 'react';
import { OptionItem } from '../types';
import { NeonTooltip } from './NeonTooltip';
import { ChevronDown } from 'lucide-react';

interface NeonSelectProps {
  id: string;
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  tooltip?: string;
}

export const NeonSelect: React.FC<NeonSelectProps> = ({ id, label, value, options, onChange, tooltip }) => {
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
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black border border-neon-pink/50 text-neon-cyan font-code p-2 pr-8 rounded focus:border-neon-pink focus:shadow-neon-pink focus:outline-none appearance-none transition-all cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-2.5 text-neon-pink pointer-events-none opacity-70" size={16} />
      </div>
    </div>
  );
};