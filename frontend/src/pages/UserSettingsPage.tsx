import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/interfaces';
import { UserSettings } from '../types/userSettings';
import { themes } from '../config/themes';
import { ThemeName } from '../types/theme';

interface UserSettingsPageProps {
  apiService: ApiService;
}

const UserSettingsPage: React.FC<UserSettingsPageProps> = ({ apiService }) => {
  const [settings, setSettings] = useState<UserSettings>({ theme: 'modern' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserSettings();
      
      if (response.success) {
        setSettings({ theme: response.data.theme as ThemeName });
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to load settings');
      }
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      const response = await apiService.updateUserSettings({ theme: newSettings.theme });
      
      if (response.success) {
        setSettings(newSettings);
        setSuccessMessage('Settings saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeName) => {
    const newSettings = { ...settings, theme: newTheme };
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-48"></div>
            <div className="h-4 bg-gray-300 rounded mb-6 w-96"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Settings</h1>
        <p className="text-gray-600 mb-6">Customize your experience with the tournament overlay system.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Theme Setting */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Theme</h2>
            <p className="text-gray-600 mb-4">Choose the visual theme for your overlay pages.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(themes).map((theme) => (
                <div
                  key={theme.name}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${settings.theme === theme.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !saving && handleThemeChange(theme.name as ThemeName)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">{theme.displayName}</h3>
                    {settings.theme === theme.name && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Theme Preview */}
                  <div className="h-16 rounded border overflow-hidden">
                    <div className={`h-full ${theme.colors.pageBackground} relative`}>
                      <div className={`absolute inset-2 ${theme.colors.cardBackground} rounded border ${theme.colors.primaryBorder}`}>
                        <div className={`absolute top-1 left-1 right-1 h-2 ${theme.colors.titleGradient} rounded-sm`}></div>
                        <div className={`absolute bottom-1 left-1 w-8 h-2 ${theme.colors.positiveColor} rounded-sm`}></div>
                        <div className={`absolute bottom-1 right-1 w-6 h-2 ${theme.colors.negativeColor} rounded-sm`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    {theme.name === 'modern' && 'Clean, modern design with blue accents'}
                    {theme.name === 'scrabble' && 'Classic Scrabble-inspired golden theme'}
                    {theme.name === 'july4' && 'Patriotic red, white, and blue theme'}
                  </p>
                </div>
              ))}
            </div>

            {saving && (
              <div className="mt-4 flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Saving theme preference...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;