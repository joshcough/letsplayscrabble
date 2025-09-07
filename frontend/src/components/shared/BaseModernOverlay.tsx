import React from 'react';
import { useTournamentTheme } from '../../hooks/useTournamentTheme';
import { getThemeClasses } from '../../utils/themeUtils';
import { Theme } from '../../types/theme';

interface BaseModernOverlayProps {
  children: (theme: Theme, themeClasses: ReturnType<typeof getThemeClasses>) => React.ReactNode;
  tournamentId?: number;
  tournamentTheme?: string; // Optional - fallback to default if not provided
}

export const BaseModernOverlay: React.FC<BaseModernOverlayProps> = ({ 
  children, 
  tournamentId, 
  tournamentTheme = 'scrabble' // Default theme
}) => {
  console.log("🔍 BaseModernOverlay: Props received", {
    tournamentId,
    tournamentIdType: typeof tournamentId,
    tournamentTheme,
  });

  // Get tournament theme (listens for theme changes via websocket)
  const { theme, loading } = useTournamentTheme({
    tournamentId,
    tournamentTheme,
  });
  
  const themeClasses = getThemeClasses(theme);
  
  console.log("🎨 BaseModernOverlay: Passing theme data to children", {
    theme,
    themeClasses,
  });
  
  if (loading) {
    return (
      <div className="bg-gray-950 min-h-screen flex items-center justify-center p-6">
        <div className="text-gray-300 text-xl">Loading theme...</div>
      </div>
    );
  }
  
  return <>{children(theme, themeClasses)}</>;
};

export default BaseModernOverlay;