import { useState, useEffect } from 'react';
import { Theme, ThemeName } from '../types/theme';
import { themes, defaultTheme } from '../config/themes';
import BroadcastManager from './BroadcastManager';
import { TournamentThemeChangedMessage } from '@shared/types/websocket';

interface UseTournamentThemeProps {
  tournamentId?: number;
  tournamentTheme: string; // Theme to use (can be default)
}

export const useTournamentTheme = ({ 
  tournamentId, 
  tournamentTheme
}: UseTournamentThemeProps): { theme: Theme; loading: boolean } => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);

  console.log("🎨 useTournamentTheme: Hook called with", {
    tournamentId,
    tournamentTheme,
    tournamentIdType: typeof tournamentId,
  });

  // Apply theme based on tournament data
  useEffect(() => {
    let resolvedTheme = defaultTheme;
    
    if (themes[tournamentTheme as ThemeName]) {
      resolvedTheme = themes[tournamentTheme as ThemeName];
      console.log(`🎨 useTournamentTheme: Using tournament theme '${tournamentTheme}' for tournament ${tournamentId}`);
    } else {
      console.warn(`⚠️ useTournamentTheme: Unknown theme '${tournamentTheme}', using default theme`);
    }
    
    setTheme(resolvedTheme);
    setLoading(false);
  }, [tournamentTheme, tournamentId]);

  // Listen for theme change broadcasts
  useEffect(() => {
    if (!tournamentId) {
      return;
    }

    const cleanup = BroadcastManager.getInstance().onTournamentThemeChanged(
      (data: TournamentThemeChangedMessage) => {
        // Only update if this broadcast is for our tournament
        if (data.tournamentId === tournamentId) {
          console.log(`🎨 useTournamentTheme: Received theme change for tournament ${tournamentId}: ${data.theme}`);
          
          if (themes[data.theme as ThemeName]) {
            setTheme(themes[data.theme as ThemeName]);
          } else {
            console.warn(`⚠️ useTournamentTheme: Unknown theme '${data.theme}', keeping current theme`);
          }
        }
      }
    );

    return cleanup;
  }, [tournamentId]);

  return { theme, loading };
};