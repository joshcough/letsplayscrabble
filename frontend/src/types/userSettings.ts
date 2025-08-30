import { ThemeName } from './theme';

export interface UserSettings {
  theme: ThemeName;
}

export interface UserSettingsResponse {
  settings: UserSettings;
}

export interface UpdateUserSettingsRequest {
  theme: ThemeName;
}