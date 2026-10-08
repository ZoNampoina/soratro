export interface SolfaDisplay {
  showRests: boolean;
  showMeasureNumbers: boolean;
  showBarlines: boolean;
  showMarkers: boolean;
  showIndications: boolean;
  holds: 'dash' | 'dot' | 'hidden';
  separators: 'all' | 'groups' | 'none';
  spacing: number;
}
export const DEFAULT_SOLFA_DISPLAY: SolfaDisplay = {
  showRests: false, showMeasureNumbers: true, showBarlines: true,
  showMarkers: true, showIndications: true, holds: 'dash', separators: 'all', spacing: 1,
};
export function solfaDisplay(project: {notation?: Partial<SolfaDisplay>}): SolfaDisplay {
  return {...DEFAULT_SOLFA_DISPLAY, ...project.notation};
}
export function solfaPreset(preset: 'clean' | 'standard' | 'detailed'): SolfaDisplay {
  if (preset === 'clean') return {...DEFAULT_SOLFA_DISPLAY, showMeasureNumbers:false, showIndications:false, separators:'groups', spacing:.9};
  if (preset === 'detailed') return {...DEFAULT_SOLFA_DISPLAY, showRests:true, spacing:1.15};
  return {...DEFAULT_SOLFA_DISPLAY};
}
