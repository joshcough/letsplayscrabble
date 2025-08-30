export interface ThemeColors {
  // Background gradients
  pageBackground: string;
  cardBackground: string;
  
  // Border and accent colors
  primaryBorder: string;
  secondaryBorder: string;
  
  // Text gradients and colors
  titleGradient: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  
  // Status colors
  positiveColor: string;
  negativeColor: string;
  neutralColor: string;
  
  // Interactive elements
  hoverBackground: string;
  shadowColor: string;
  
  // Special accents
  accentGradient: string;
  ringColor: string;
}

export interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
}

export type ThemeName = 'modern' | 'scrabble' | 'july4' | 'original';