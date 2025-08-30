import { Theme } from '../types/theme';

/**
 * Utility function to combine theme classes with additional classes
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Helper function to get theme-aware classes
 */
export const getThemeClasses = (theme: Theme) => ({
  // Page layouts
  pageBackground: theme.colors.pageBackground,
  
  // Cards and containers
  card: cn(
    theme.colors.cardBackground,
    'rounded-2xl p-6 border-2',
    theme.colors.primaryBorder,
    'shadow-2xl',
    theme.colors.shadowColor
  ),
  
  smallCard: cn(
    theme.colors.cardBackground,
    'rounded-xl p-4 border',
    theme.colors.primaryBorder,
    'shadow-2xl',
    theme.colors.shadowColor
  ),
  
  // Typography
  title: cn(
    'text-4xl font-black text-transparent bg-clip-text',
    theme.colors.titleGradient
  ),
  
  subtitle: cn(
    'text-xl',
    theme.colors.textSecondary
  ),
  
  text: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  textAccent: theme.colors.textAccent,
  
  // Status colors
  positive: theme.colors.positiveColor,
  negative: theme.colors.negativeColor,
  neutral: theme.colors.neutralColor,
  
  // Interactive elements
  tableRow: cn(
    'border-b last:border-0 transition-colors',
    theme.colors.secondaryBorder,
    theme.colors.hoverBackground
  ),
  
  // Special elements
  accentCircle: cn(
    theme.colors.accentGradient,
    'rounded-full w-16 h-16 flex items-center justify-center shadow-xl ring-2',
    theme.colors.ringColor
  ),
  
  playerImage: cn(
    'rounded-xl object-cover border-2',
    theme.colors.primaryBorder
  ),
  
  playerPlaceholder: cn(
    'bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg'
  ),
});