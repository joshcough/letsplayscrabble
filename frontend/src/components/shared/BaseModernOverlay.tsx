import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { getThemeClasses } from '../../utils/themeUtils';
import { Theme } from '../../types/theme';

interface BaseModernOverlayProps {
  children: (theme: Theme, themeClasses: ReturnType<typeof getThemeClasses>) => React.ReactNode;
}

export const BaseModernOverlay: React.FC<BaseModernOverlayProps> = ({ children }) => {
  const { theme, loading, error } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-gray-300 text-xl">Loading theme...</div>
      </div>
    );
  }
  
  if (error) {
    console.error('Theme error:', error);
    // Continue with default theme
  }
  
  return <>{children(theme, themeClasses)}</>;
};

export default BaseModernOverlay;