import React from 'react';
import { SOUND_OPTIONS } from '../constants';
import { NeonTooltip } from './NeonTooltip';

interface SoundSelectorProps {
  selectedSounds: string[];
  onChange: (selected: string[]) => void;
}

export const SoundSelector: React.FC<SoundSelectorProps> = ({ selectedSounds, onChange }) => {
  const toggleSound = (val: string) => {
    if (selectedSounds.includes(val)) {
      onChange(selectedSounds.filter(s => s !== val));
    } else {
      onChange([...selectedSounds, val]);
    }
  };

  return (
    <div>
      <NeonTooltip content="El orden de los audios en el nombre final dependerá del orden en que los selecciones." align="left">
        <h3 className="font-retro text-neon-pink text-[10px] mb-3 cursor-help inline-block">AUDIO CONFIGURATION</h3>
      </NeonTooltip>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SOUND_OPTIONS.map(opt => {
          const isSelected = selectedSounds.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleSound(opt.value)}
              className={`
                text-xs font-tech py-2 px-1 border transition-all duration-200
                ${isSelected 
                  ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan shadow-[0_0_5px_#00FFFF]' 
                  : 'bg-transparent text-neon-pink/70 border-neon-pink/30 hover:border-neon-pink hover:text-neon-pink'
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  );
};