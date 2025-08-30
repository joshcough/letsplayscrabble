import { Theme } from '../types/theme';

export const modernTheme: Theme = {
  name: 'modern',
  displayName: 'Modern',
  colors: {
    pageBackground: 'bg-gradient-to-br from-gray-950 via-gray-900 to-black',
    cardBackground: 'bg-gradient-to-br from-blue-900/50 to-gray-900/60 backdrop-blur-xl',
    
    primaryBorder: 'border-blue-400/50',
    secondaryBorder: 'border-blue-600/20',
    
    titleGradient: 'bg-gradient-to-r from-blue-400 to-purple-600',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textAccent: 'text-blue-400',
    
    positiveColor: 'text-green-400',
    negativeColor: 'text-red-400',
    neutralColor: 'text-gray-400',
    
    hoverBackground: 'hover:bg-blue-800/20',
    shadowColor: 'shadow-blue-400/10',
    
    accentGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700',
    ringColor: 'ring-purple-400/30',
  }
};

export const scrabbleTheme: Theme = {
  name: 'scrabble',
  displayName: 'Scrabble',
  colors: {
    // Based on main site: warm beige background (#E4C6A0)
    pageBackground: 'bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100',
    // Card background: cream/off-white (#FAF1DB) with subtle transparency
    cardBackground: 'bg-gradient-to-br from-amber-50/90 to-orange-50/80 backdrop-blur-xl',
    
    // Primary border: dark brown (#4A3728)
    primaryBorder: 'border-amber-900/80',
    secondaryBorder: 'border-amber-800/40',
    
    // Title gradient using main site colors
    titleGradient: 'bg-gradient-to-r from-amber-900 via-amber-700 to-yellow-700',
    textPrimary: 'text-amber-900', // Dark brown text (#4A3728)
    textSecondary: 'text-amber-700', // Medium brown (#6B5744)
    textAccent: 'text-amber-800', // Accent color
    
    positiveColor: 'text-green-700',
    negativeColor: 'text-red-700',
    neutralColor: 'text-amber-700',
    
    hoverBackground: 'hover:bg-amber-900/10',
    shadowColor: 'shadow-amber-900/20',
    
    accentGradient: 'bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-700',
    ringColor: 'ring-amber-800/30',
  }
};

export const july4Theme: Theme = {
  name: 'july4',
  displayName: 'July 4th',
  colors: {
    // Darker navy background for better contrast
    pageBackground: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800',
    // Lighter, more opaque cards for better readability
    cardBackground: 'bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-xl',
    
    // Strong borders for definition
    primaryBorder: 'border-blue-800/80',
    secondaryBorder: 'border-slate-600/70', // Darker lines between table rows
    
    // Patriotic gradient title
    titleGradient: 'bg-gradient-to-r from-blue-600 via-red-600 to-blue-600',
    // Dark text on light cards for contrast
    textPrimary: 'text-slate-900',
    textSecondary: 'text-white', // Changed this to white for tournament/division names on dark background
    textAccent: 'text-blue-800',
    
    // Strong patriotic colors for gains/losses
    positiveColor: 'text-blue-700',
    negativeColor: 'text-red-700',
    neutralColor: 'text-slate-800',
    
    hoverBackground: 'hover:bg-blue-100/30',
    shadowColor: 'shadow-blue-900/20',
    
    accentGradient: 'bg-gradient-to-r from-blue-700 via-red-600 to-blue-700',
    ringColor: 'ring-blue-600/40',
  }
};

export const themes: Record<string, Theme> = {
  modern: modernTheme,
  scrabble: scrabbleTheme,
  july4: july4Theme,
};

export const defaultTheme = scrabbleTheme;