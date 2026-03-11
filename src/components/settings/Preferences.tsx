import React, { useState } from 'react';
import { useFirmStore } from '../../store/useFirmStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button, Input, Select } from '../ui';
import { cn } from '../../utils/formatters';
import { Preferences } from '../../types/settings';

export const Preferences: React.FC = () => {
  const preferences = useFirmStore((state) => state.preferences);
  const setPreferences = useFirmStore((state) => state.setPreferences);

  const [localState, setLocalState] = useState<Partial<Preferences>>({
    theme: preferences.theme,
    language: preferences.language,
    dateFormat: preferences.dateFormat,
  });

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setLocalState(prev => ({ ...prev, theme }));
    const newPrefs: Preferences = { ...preferences, theme };
    setPreferences(newPrefs);
  };

  const handleLanguageChange = (language: 'en' | 'es' | 'fr') => {
    setLocalState(prev => ({ ...prev, language }));
    const newPrefs: Preferences = { ...preferences, language };
    setPreferences(newPrefs);
  };

  const handleDateFormatChange = (dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD') => {
    setLocalState(prev => ({ ...prev, dateFormat }));
    const newPrefs: Preferences = { ...preferences, dateFormat };
    setPreferences(newPrefs);
  };

  const handleNotificationsChange = (notifications: boolean) => {
    setLocalState(prev => ({ ...prev, notifications }));
    const newPrefs: Preferences = { ...preferences, notifications };
    setPreferences(newPrefs);
  };

  const handleAutoSaveChange = (autoSave: boolean) => {
    setLocalState(prev => ({ ...prev, autoSave }));
    const newPrefs: Preferences = { ...preferences, autoSave };
    setPreferences(newPrefs);
  };

  const handleSave = () => {
    const newPrefs: Preferences = { ...preferences, ...localState };
    setPreferences(newPrefs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Theme Selection */}
        <div className="flex items-center gap-3">
          <label htmlFor="theme" className="text-sm font-medium text-gray-700">Theme</label>
          <Select
            id="theme"
            value={localState.theme}
            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
            options={[
              { value: 'system', label: 'System Default' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            className="w-48"
          />
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-3">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">Language</label>
          <Select
            id="language"
            value={localState.language}
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'es' | 'fr')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
            ]}
            className="w-48"
          />
        </div>

        {/* Date Format Selection */}
        <div className="flex items-center gap-3">
          <label htmlFor="date-format" className="text-sm font-medium text-gray-700">Date Format</label>
          <Select
            id="date-format"
            value={localState.dateFormat}
            onChange={(e) => handleDateFormatChange(e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')}
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
            className="w-48"
          />
        </div>

        {/* Time Zone */}
        <div className="flex items-center gap-3">
          <label htmlFor="time-zone" className="text-sm font-medium text-gray-700">Time Zone</label>
          <Input
            id="time-zone"
            type="text"
            value={preferences.timeZone}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="America/New_York"
          />
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="notifications"
            type="checkbox"
            checked={localState.notifications}
            onChange={(e) => handleNotificationsChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
          />
          <label htmlFor="notifications" className="text-sm font-medium text-gray-700">
            Enable Notifications
          </label>
        </div>

        {/* Auto Save Toggle */}
        <div className="flex items-center gap-3">
          <input
            id="auto-save"
            type="checkbox"
            checked={localState.autoSave}
            onChange={(e) => handleAutoSaveChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
          />
          <label htmlFor="auto-save" className="text-sm font-medium text-gray-700">
            Auto-Save Settings
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleSave}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>

        {/* Preference Info */}
        <div className="bg-blue-50 p-3 rounded-lg mt-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Tip:</strong> Changes to theme, language, and date format will take effect immediately. Notifications preferences affect toast alerts and system notifications.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
