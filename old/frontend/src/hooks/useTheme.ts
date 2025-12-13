import { useState, useEffect } from 'react';
import { Theme } from '../types/theme';
import { themes, defaultTheme } from '../config/themes';
import { ApiService } from '../services/interfaces';

// We'll need to get this from context or props - for now using a simple approach
let apiServiceInstance: ApiService | null = null;

export const setApiServiceForTheme = (apiService: ApiService) => {
  apiServiceInstance = apiService;
};

export const useTheme = (): { theme: Theme; loading: boolean; error: string | null } => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserTheme = async () => {
      if (!apiServiceInstance) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await apiServiceInstance.getUserSettings();
        
        if (response.success) {
          const userTheme = response.data.theme || 'modern';
          
          if (themes[userTheme]) {
            setTheme(themes[userTheme]);
          } else {
            setTheme(defaultTheme);
          }
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to load settings');
        }
      } catch (err) {
        console.error('Theme loading error:', err);
        setError('Failed to load theme preference');
        setTheme(defaultTheme);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserTheme();
  }, []);
  
  return { theme, loading, error };
};