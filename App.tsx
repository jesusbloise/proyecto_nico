import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Save, Zap, Key, Lock, LogOut } from 'lucide-react';
import { NeonInput } from './components/NeonInput';
import { NeonSelect } from './components/NeonSelect';
import { SoundSelector } from './components/SoundSelector';
import { OrderController } from './components/OrderController';
import { NeonTooltip } from './components/NeonTooltip';
import { LicenseGate } from './components/LicenseGate';
import { 
  TYPE_OPTIONS, RESOLUTION_OPTIONS, COLOR_SPACE_OPTIONS, 
  CONTAINER_OPTIONS, COMPRESOR_OPTIONS, FRAMERATE_OPTIONS, 
  ASPECT_RATIO_OPTIONS, LANGUAGE_OPTIONS, SUBTITLE_TYPE_OPTIONS, 
  LUMINANCE_OPTIONS
} from './constants';
import { PRESETS, TokenKey } from './types';

const DEFAULT_PRESET = 'Archival';
const DEFAULT_ORDER: TokenKey[] = PRESETS[DEFAULT_PRESET];
const LICENSE_STORAGE_KEY = 'mediaProNamerLicense';

const App: React.FC = () => {
  // --- LICENSE STATE ---
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [loadingLicense, setLoadingLicense] = useState(true);

  // --- APP STATE ---
  const [values, setValues] = useState<Record<TokenKey, string>>({
    id: '',
    'episode-reel': '',
    type: 'NONE',
    language: 'NONE',
    subtitles: 'NONE',
    resolution: 'NONE',
    'color-space': 'NONE',
    luminance: 'NONE',
    container: 'NONE',
    compresor: 'NONE',
    framerate: 'NONE',
    'aspect-ratio': 'NONE',
    sound: 'NONE', 
    date: '',
    version: ''
  });

  const [subtitleLang, setSubtitleLang] = useState<string>('NONE');
  const [soundSelection, setSoundSelection] = useState<string[]>([]);
  const [order, setOrder] = useState<TokenKey[]>(DEFAULT_ORDER);
  const [filename, setFilename] = useState('');
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportKeyFeedback, setExportKeyFeedback] = useState(false);

  // Load License & Settings on Mount
  useEffect(() => {
    // Check License
    const savedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (savedLicense) {
        setIsLicensed(true);
    }
    setLoadingLicense(false);

    // Load Settings
    const storedData = localStorage.getItem('mediaProNamerData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.values) setValues(prev => ({ ...prev, ...parsed.values }));
        if (parsed.order) setOrder(parsed.order);
        if (parsed.soundSelection) setSoundSelection(parsed.soundSelection);
        if (parsed.preset) setPreset(parsed.preset);
        if (parsed.subtitleLang) setSubtitleLang(parsed.subtitleLang);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // License Handlers
  const handleUnlock = (key: string) => {
      localStorage.setItem(LICENSE_STORAGE_KEY, key);
      setIsLicensed(true);
  };

  const handleDeactivate = () => {
      if(confirm("Are you sure you want to deactivate this terminal? You will need your license key to enter again.")) {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        setIsLicensed(false);
      }
  };

  // Update Filename
  const generateFilename = useCallback(() => {
    const parts = order.map(key => {
      if (key === 'sound') {
        return soundSelection.length > 0 ? soundSelection.join('-') : '';
      }
      
      // Special handling for composite Subtitles token
      if (key === 'subtitles') {
        const subType = values.subtitles;
        const subL = subtitleLang;

        if (subType === 'NONE') return '';
        
        // If we have a subtype (e.g., CLEAN, SUB, CC), combine with language if present
        if (subL !== 'NONE') {
            return `${subType}-${subL}`;
        }
        return subType;
      }

      const val = values[key];
      return val && val !== 'NONE' ? val : '';
    });
    
    // Filter empty strings and join
    const name = parts.filter(p => p !== '').join('_');
    setFilename(name);
  }, [values, order, soundSelection, subtitleLang]);

  useEffect(() => {
    generateFilename();
  }, [generateFilename]);

  // Handlers
  const handleValueChange = (key: TokenKey, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    if (PRESETS[newPreset]) {
      setOrder(PRESETS[newPreset]);
    }
  };

  const handleSave = () => {
    const dataToSave = {
      values,
      order,
      soundSelection,
      preset,
      subtitleLang
    };
    localStorage.setItem('mediaProNamerData', JSON.stringify(dataToSave));
    alert("SETTINGS SAVED TO CORE MEMORY.");
  };

  const handleCopy = () => {
    if (!filename) return;
    navigator.clipboard.writeText(filename).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  const handleExportKey = () => {
    const getKeyLabel = (key: TokenKey) => {
        switch(key) {
            case 'episode-reel': return 'EP/REEL';
            case 'color-space': return 'COLOR';
            case 'aspect-ratio': return 'ASPECT';
            case 'language': return 'AUDIO';
            case 'subtitles': return 'SUBS';
            case 'luminance': return 'NITS';
            case 'compresor': return 'CODEC';
            case 'container': return 'EXT';
            default: return key.toUpperCase();
        }
    }
    
    const parts = order.map(key => {
        let isActive = false;
        
        if (key === 'sound') {
            isActive = soundSelection.length > 0;
        } else if (key === 'subtitles') {
            isActive = values.subtitles !== 'NONE';
        } else {
            isActive = values[key] && values[key] !== 'NONE';
        }

        if (isActive) {
            return `[${getKeyLabel(key)}]`;
        }
        return null;
    });

    const keyString = parts.filter(Boolean).join('_');
    
    if (!keyString) return;

    navigator.clipboard.writeText(keyString).then(() => {
      setExportKeyFeedback(true);
      setTimeout(() => setExportKeyFeedback(false), 2000);
    });
  };

  if (loadingLicense) return null;

  if (!isLicensed) {
      return <LicenseGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-200">
      
      {/* Header */}
      <header className="mb-8 border-b-2 border-neon-pink pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-retro text-neon-pink drop-shadow-[0_0_8px_rgba(255,106,193,0.8)] mb-2 leading-none">
              MEDIA PRO NAMER <span className="text-neon-cyan text-lg md:text-2xl animate-pulse">NEON</span>
            </h1>
            <p className="font-code text-neon-cyan tracking-[0.2em] text-xs md:text-sm opacity-80">
              ADVANCED_FILE_NAMING_SYSTEM_V3.0
            </p>
          </div>
        </div>
        <div className="hidden md:block text-right font-tech text-xs text-neon-pink/50">
          SYS.STATUS: ONLINE<br/>
          LICENSE: ACTIVE
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Core Metadata & Localization */}
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">CORE METADATA</h2>
                <NeonInput id="id" label="ID" value={values.id} onChange={(v) => handleValueChange('id', v)} tooltip="Identificador único del proyecto o activo." />
                <NeonInput id="episode" label="EPISODE / REEL" value={values['episode-reel']} onChange={(v) => handleValueChange('episode-reel', v)} tooltip="Número de Episodio o Rollo (Reel)." />
                <NeonSelect id="type" label="TYPE" value={values.type} options={TYPE_OPTIONS} onChange={(v) => handleValueChange('type', v)} tooltip="Tipo de contenido (Master, Review, etc)." />
                <div className="grid grid-cols-2 gap-4">
                  <NeonInput id="date" label="DATE" type="date" value={values.date} onChange={(v) => handleValueChange('date', v)} tooltip="Fecha de creación (YYYYMMDD)." />
                  <NeonInput id="version" label="VERSION" value={values.version} onChange={(v) => handleValueChange('version', v)} tooltip="Número de versión (v01, v02...)." />
                </div>
            </div>

            <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">LOCALIZATION</h2>
                <NeonSelect id="lang" label="AUDIO LANGUAGE" value={values.language} options={LANGUAGE_OPTIONS} onChange={(v) => handleValueChange('language', v)} tooltip="Idioma principal del audio." />
                <div className="grid grid-cols-2 gap-4">
                  <NeonSelect id="subs_type" label="SUB TITLE TYPE" value={values.subtitles} options={SUBTITLE_TYPE_OPTIONS} onChange={(v) => handleValueChange('subtitles', v)} tooltip="Tipo de subtítulos (Quemados, Textless)." />
                  <NeonSelect id="subs_lang" label="SUB LANGUAGE" value={subtitleLang} options={LANGUAGE_OPTIONS} onChange={(v) => setSubtitleLang(v)} tooltip="Idioma de los subtítulos." />
                </div>
            </div>
        </div>

        {/* Middle Column: Technical & Sound */}
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                 <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">TECHNICAL SPECS</h2>
                <NeonSelect id="res" label="RESOLUTION" value={values.resolution} options={RESOLUTION_OPTIONS} onChange={(v) => handleValueChange('resolution', v)} tooltip="Resolución de imagen (1920x1080, 4K...)." />
                <div className="grid grid-cols-2 gap-4">
                   <NeonSelect id="cs" label="COLOR SPACE" value={values['color-space']} options={COLOR_SPACE_OPTIONS} onChange={(v) => handleValueChange('color-space', v)} tooltip="Espacio de color y curva gamma." />
                   <NeonSelect id="nits" label="LUMINANCE" value={values.luminance} options={LUMINANCE_OPTIONS} onChange={(v) => handleValueChange('luminance', v)} tooltip="Brillo máximo en Nits (HDR)." />
                </div>
                <NeonSelect id="ar" label="ASPECT RATIO" value={values['aspect-ratio']} options={ASPECT_RATIO_OPTIONS} onChange={(v) => handleValueChange('aspect-ratio', v)} tooltip="Relación de aspecto de la imagen." />
                <NeonSelect id="fps" label="FRAMERATE" value={values.framerate} options={FRAMERATE_OPTIONS} onChange={(v) => handleValueChange('framerate', v)} tooltip="Velocidad de cuadros por segundo (FPS)." />
            </div>

            <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">FORMAT & AUDIO</h2>
                <NeonSelect id="container" label="CONTAINER" value={values.container} options={CONTAINER_OPTIONS} onChange={(v) => handleValueChange('container', v)} tooltip="Formato contenedor del archivo (.mov, .mxf)." />
                <NeonSelect id="codec" label="COMPRESSOR" value={values.compresor} options={COMPRESOR_OPTIONS} onChange={(v) => handleValueChange('compresor', v)} tooltip="Códec de compresión de video." />
                
                <div className="mt-6 border-t border-neon-pink/20 pt-4">
                    <SoundSelector selectedSounds={soundSelection} onChange={setSoundSelection} />
                </div>
            </div>
        </div>

        {/* Right Column: Order, Preset, Output */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
            {/* Presets */}
            <div className="bg-neon-panel/40 border border-neon-cyan/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                    <NeonTooltip content="Selecciona una configuración predefinida para ordenar los tokens." align="left">
                         <label className="block text-neon-cyan font-code tracking-wider text-sm cursor-help">PRESET CONFIG:</label>
                    </NeonTooltip>
                </div>
                
                <div className="relative">
                    <select 
                        value={preset}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full bg-black border border-neon-cyan text-neon-cyan font-code p-2 rounded focus:shadow-neon-cyan focus:outline-none appearance-none cursor-pointer"
                    >
                        {Object.keys(PRESETS).map(k => (
                            <option key={k} value={k}>{k.toUpperCase()}</option>
                        ))}
                    </select>
                    <Zap className="absolute right-2 top-2.5 text-neon-cyan pointer-events-none" size={16} />
                </div>
            </div>

            {/* Order Controller */}
            <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg flex-grow">
                <OrderController order={order} onOrderChange={setOrder} />
            </div>

             {/* Actions */}
             <div className="bg-neon-panel p-4 rounded-lg border-2 border-neon-pink shadow-neon-pink sticky bottom-4 z-40">
                <label className="block mb-1 text-neon-pink font-retro text-xs">GENERATED FILENAME:</label>
                <div className="bg-neon-cyan text-black font-code text-lg p-3 break-all mb-4 min-h-[3.5rem] flex items-center border-2 border-black shadow-inner">
                    {filename || <span className="opacity-30">WAITING_FOR_INPUT...</span>}
                </div>

                <div className="flex gap-2">
                    <NeonTooltip content="Copiar el nombre generado al portapapeles." className="flex-1" align="left">
                        <button 
                            onClick={handleCopy}
                            className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
                                copyFeedback 
                                ? 'bg-white text-neon-pink border-white' 
                                : 'bg-neon-pink text-black border-neon-pink hover:bg-pink-400 hover:shadow-[0_0_15px_#ff6ac1]'
                            }`}
                        >
                            {copyFeedback ? 'COPIED!' : <>COPY <Copy size={14} /></>}
                        </button>
                    </NeonTooltip>

                    <NeonTooltip content="Copiar la estructura/guía de los tokens utilizados." className="flex-1" align="center">
                        <button 
                            onClick={handleExportKey}
                            className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
                                exportKeyFeedback
                                ? 'bg-white text-neon-cyan border-white'
                                : 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF]'
                            }`}
                        >
                            {exportKeyFeedback ? 'KEY COPIED!' : <>KEY <Key size={14} /></>}
                        </button>
                    </NeonTooltip>

                    <NeonTooltip content="Guardar configuración actual." align="right">
                        <button 
                            onClick={handleSave}
                            className="w-12 flex items-center justify-center bg-transparent text-neon-pink font-retro text-xs py-3 border-2 border-neon-pink hover:bg-neon-pink/20 hover:shadow-[0_0_10px_#ff6ac1] transition-all"
                        >
                            <Save size={16} />
                        </button>
                    </NeonTooltip>
                </div>
            </div>
        </div>
      </div>

      <footer className="mt-12 flex flex-col items-center justify-center gap-2 font-code text-neon-pink/40 text-sm pb-8">
        <div>&copy; MEDIA PRO NAMER BY NICO</div>
        <button 
            onClick={handleDeactivate}
            className="flex items-center gap-1 text-xs opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
        >
            <LogOut size={12} /> DEACTIVATE TERMINAL
        </button>
      </footer>
    </div>
  );
};

export default App;