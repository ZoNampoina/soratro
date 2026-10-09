import type { PageSettings } from '../music/model.ts';

/** Device display preferences; these never modify the musical project. */
export interface SolfaDisplay {
  rests: boolean;
  measureNumbers: boolean;
  markers: boolean;
  holds: boolean;
  separators: 'standard' | 'bars' | 'none';
  noteScale: number;
  spacing: number;
  density: 'compact' | 'standard' | 'airy';
}
export const DEFAULT_SOLFA: SolfaDisplay = {
  rests: false, measureNumbers: true, markers: true, holds: true,
  separators: 'standard', noteScale: 1, spacing: 1, density: 'standard',
};
export const SOLFA_PRESETS: Record<string, SolfaDisplay> = {
  'Épuré': { ...DEFAULT_SOLFA, measureNumbers: false, separators: 'bars', density: 'compact' },
  'Standard': { ...DEFAULT_SOLFA },
  'Détaillé': { ...DEFAULT_SOLFA, rests: true, density: 'airy' },
};
export function displayLayout(layout: PageSettings, display: SolfaDisplay): PageSettings {
  const factor = display.density === 'compact' ? .85 : display.density === 'airy' ? 1.2 : 1;
  return { ...layout,
    noteSize: Math.max(10, Math.min(32, layout.noteSize * display.noteScale)),
    voiceGap: Math.max(20, Math.min(70, layout.voiceGap * factor)),
    systemGap: Math.max(8, Math.min(80, layout.systemGap * factor)),
  };
}
