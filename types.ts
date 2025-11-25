export type TokenKey = 
  | 'id' 
  | 'episode-reel' 
  | 'type' 
  | 'language'
  | 'subtitles'
  | 'resolution' 
  | 'color-space' 
  | 'luminance'
  | 'container' 
  | 'compresor' 
  | 'framerate' 
  | 'aspect-ratio' 
  | 'sound' 
  | 'date'
  | 'version';

export interface OptionItem {
  value: string;
  label: string;
}

export interface AppState {
  values: Record<TokenKey, string>;
  subtitleLanguage: string; // Helper state for composite token
  order: TokenKey[];
  soundSelection: string[]; 
}

export const PRESETS: Record<string, TokenKey[]> = {
  Film: ['id', 'episode-reel', 'type', 'resolution', 'color-space', 'compresor', 'language', 'subtitles', 'framerate', 'aspect-ratio', 'sound', 'date', 'version'],
  Social: ['id', 'type', 'resolution', 'aspect-ratio', 'sound', 'date', 'version'],
  Review: ['id', 'episode-reel', 'type', 'resolution', 'color-space', 'luminance', 'sound', 'date', 'version'],
  Delivery: ['id', 'episode-reel', 'type', 'resolution', 'color-space', 'compresor', 'language', 'subtitles', 'framerate', 'aspect-ratio', 'sound', 'date', 'version'],
  Archival: ['id', 'episode-reel', 'type', 'resolution', 'color-space', 'luminance', 'container', 'compresor', 'language', 'subtitles', 'framerate', 'aspect-ratio', 'sound', 'date', 'version']
};