import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import storage from './storage';
import { Theme, lightTheme, darkTheme } from './theme';
import { getUserProfile, saveUserProfile } from './database';

export type ResponseLength = 'concise' | 'balanced' | 'detailed';
export type ColorScheme = 'light' | 'dark';

export interface Settings {
  name: string;
  about: string;
  responseLength: ResponseLength;
  includeScriptureReferences: boolean;
  askClarifyingQuestions: boolean;
  colorScheme: ColorScheme;
}

interface SettingsContextType {
  settings: Settings;
  theme: Theme;
  updateSettings: (newSettings: Partial<Settings>, userId?: string) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
  loadProfileFromDatabase: (userId: string) => Promise<void>;
}

const defaultSettings: Settings = {
  name: '',
  about: '',
  responseLength: 'balanced',
  includeScriptureReferences: true,
  askClarifyingQuestions: true,
  colorScheme: 'light',
};

const SETTINGS_STORAGE_KEY = '@bible_chat_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setTheme(settings.colorScheme === 'dark' ? darkTheme : lightTheme);
  }, [settings.colorScheme]);

  async function loadSettings() {
    try {
      const storedSettings = await storage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        const cleanedSettings: Settings = {
          name: parsed.name || defaultSettings.name,
          about: parsed.about || defaultSettings.about,
          responseLength: parsed.responseLength || defaultSettings.responseLength,
          includeScriptureReferences: parsed.includeScriptureReferences !== undefined
            ? parsed.includeScriptureReferences
            : defaultSettings.includeScriptureReferences,
          askClarifyingQuestions: parsed.askClarifyingQuestions !== undefined
            ? parsed.askClarifyingQuestions
            : defaultSettings.askClarifyingQuestions,
          colorScheme: parsed.colorScheme || defaultSettings.colorScheme,
        };
        setSettings(cleanedSettings);
        await storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cleanedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function updateSettings(newSettings: Partial<Settings>, userId?: string) {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

      if (userId && ('name' in newSettings || 'about' in newSettings)) {
        await saveUserProfile(userId, updatedSettings.name, updatedSettings.about);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async function loadProfileFromDatabase(userId: string) {
    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        const updatedSettings = {
          ...settings,
          name: profile.name,
          about: profile.about
        };
        setSettings(updatedSettings);
        await storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      }
    } catch (error) {
      console.error('Failed to load profile from database:', error);
    }
  }

  async function toggleColorScheme() {
    const newScheme = settings.colorScheme === 'light' ? 'dark' : 'light';
    await updateSettings({ colorScheme: newScheme });
  }

  return (
    <SettingsContext.Provider value={{ settings, theme, updateSettings, toggleColorScheme, loadProfileFromDatabase }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export const responseLengthDescriptions: Record<ResponseLength, string> = {
  concise: 'Brief, to-the-point answers',
  balanced: 'Moderate detail with key insights',
  detailed: 'Comprehensive explanations with examples',
};
