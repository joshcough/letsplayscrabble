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
    pageBackground: 'bg-gradient-to-br from-blue-950 via-red-950 to-blue-900',
    cardBackground: 'bg-gradient-to-br from-blue-800/50 to-red-800/50 backdrop-blur-xl',
    
    primaryBorder: 'border-red-400/60',
    secondaryBorder: 'border-blue-400/30',
    
    titleGradient: 'bg-gradient-to-r from-blue-300 via-white to-red-400',
    textPrimary: 'text-white',
    textSecondary: 'text-blue-200',
    textAccent: 'text-red-300',
    
    positiveColor: 'text-blue-300',
    negativeColor: 'text-red-300',
    neutralColor: 'text-white',
    
    hoverBackground: 'hover:bg-red-700/20',
    shadowColor: 'shadow-red-400/15',
    
    accentGradient: 'bg-gradient-to-r from-blue-600 via-white to-red-600',
    ringColor: 'ring-red-400/40',
  }
};

export const themes: Record<string, Theme> = {
  modern: modernTheme,
  scrabble: scrabbleTheme,
  july4: july4Theme,
};

export const defaultTheme = scrabbleTheme;