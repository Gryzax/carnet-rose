// Cozy hand-drawn journal palette — see DESIGN.md.
// Light mode only: warm peach paper, white notebook cards, black ink borders,
// pastel pink active states, sage section labels, warm orange accents.
export const colors = {
  // Pinks — active filters, primary CTAs, day-style pills
  primaryPink: '#DB2777',
  lightPink: '#FBCFE4',
  softPink: '#FBCFE4',
  pink: '#DB2777',
  pinkSoft: '#FBCFE4',
  deepPink: '#BE185D',
  onPrimary: '#FFFFFF',

  // Surfaces
  white: '#FFFFFF',
  offWhite: '#FFFFFF',
  canvas: '#F9E8E0',
  card: '#FFFFFF',
  // Subtle neutral fill — discreet controls like the search clear button
  neutralSoft: '#EDE6E4',

  // Sage — section labels, secondary actions
  sage: '#C9D9CF',
  sageStrong: '#B2C7BC',

  // Warm coral-orange — washi tape, sparkles, info accents
  orange: '#E79360',
  orangeSoft: '#F2A877',

  // Ink and text
  ink: '#1A1A1A',
  textDark: '#1A1A1A',
  muted: '#7D6D6A',
  textMuted: '#7D6D6A',
  placeholder: '#AC9B98',
  border: '#1A1A1A',

  // Status tones — data/status only, not page theming
  successGreen: '#74A684',
  dangerRed: '#C05C6B',
  warningOrange: '#DA9150',

  // No dark mode — kept only so legacy references resolve
  darkBg: '#F9E8E0',
  darkCard: '#FFFFFF',

  scrim: 'rgba(26,26,26,0.48)'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 20,
  full: 999
};

export const typography = {
  regular: 'PatrickHand_400Regular',
  fallback: 'PatrickHand_400Regular'
};

export type ColorName = keyof typeof colors;
