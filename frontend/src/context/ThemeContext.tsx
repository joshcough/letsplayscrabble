import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types/theme';
import { defaultTheme } from '../config/themes';

interface ThemeContextType {
  theme: Theme;
  loading: boolean;
  error: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  loading: false,
  error: null,
});

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, loading, error } = useTheme();

  return (
    <ThemeContext.Provider value={{ theme, loading, error }}>
      {children}
    </ThemeContext.Provider>
  );
};