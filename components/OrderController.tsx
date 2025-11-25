import React from 'react';
import { TokenKey } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface OrderControllerProps {
  order: TokenKey[];
  onOrderChange: (newOrder: TokenKey[]) => void;
}

export const OrderController: React.FC<OrderControllerProps> = ({ order, onOrderChange }) => {
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === order.length - 1) return;

    const newOrder = [...order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onOrderChange(newOrder);
  };

  const getLabel = (key: TokenKey) => {
    // Short labels for the token list
    const labels: Record<TokenKey, string> = {
      'id': 'ID',
      'episode-reel': 'EP/REEL',
      'type': 'TYPE',
      'language': 'LANG',
      'subtitles': 'SUBS',
      'resolution': 'RES',
      'color-space': 'CS',
      'luminance': 'NITS',
      'container': 'EXT',
      'compresor': 'CODEC',
      'framerate': 'FPS',
      'aspect-ratio': 'AR',
      'sound': 'AUDIO',
      'date': 'DATE',
      'version': 'VER'
    };
    return labels[key] || key;
  };

  return (
    <div>
      <h3 className="font-retro text-neon-cyan text-xs mb-3">TOKEN ORDER</h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neon-cyan scrollbar-track-transparent">
        {order.map((key, index) => (
          <div 
            key={`${key}-${index}`}
            className="flex items-center justify-between bg-black/50 border border-neon-cyan/30 p-2 rounded hover:border-neon-cyan transition-colors group"
          >
            <span className="font-code text-neon-cyan text-sm sm:text-base">
              <span className="opacity-50 mr-2 text-xs">{index + 1}.</span>
              {getLabel(key)}
            </span>
            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 hover:text-neon-cyan disabled:opacity-20 transition-colors"
               >
                 <ArrowUp size={14} />
               </button>
               <button 
                onClick={() => moveItem(index, 'down')}
                disabled={index === order.length - 1}
                className="p-1 hover:text-neon-cyan disabled:opacity-20 transition-colors"
               >
                 <ArrowDown size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};