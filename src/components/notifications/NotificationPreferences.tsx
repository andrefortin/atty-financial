/**
 * Notification Preferences Component
 *
 * User notification preferences settings.
 * Integrates with NotificationService.
 *
 * @module components/notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellOff,
  Mail,
  MailOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Check,
  X,
  Filter,
  Sliders,
  Zap,
  Info,
  AlertTriangle,
  CheckCircle,
  Trash2,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface NotificationPreferencesProps {
  userId: string;
  showToast?: boolean;
}

interface PreferenceSection {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

interface TogglePreferenceProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface PreferenceProps {
  label: string;
  value: string | number | boolean;
  onChange: (value: any) => void;
  options?: Array<{ label: string; value: any }>;
}

// ============================================
// Notification Preferences Component
// ============================================

export function NotificationPreferences({ userId, showToast = true }: NotificationPreferencesProps) {
  // State
  const [preferences, setPreferences] = useState({
    // General
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    soundEnabled: true,

    // Quiet Hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',

    // Notifications Types
    matterNotifications: true,
    transactionNotifications: true,
    interestNotifications: true,
    reportNotifications: true,
    userMentions: true,
    systemNotifications: true,

    // Priority
    highPriorityOnly: false,

    // Sound
    notificationSound: 'default',
    volume: 75,
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(`notification-preferences-${userId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };

    loadPreferences();

    return () => {
      try {
        localStorage.setItem(`notification-preferences-${userId}`, JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save notification preferences:', error);
      }
    };
  }, [userId]);

  // Handle save
  const handleSave = useCallback(async () => {
    setLoading(true);

    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 500));

    // Save to local storage
    const cleanup = savePreferences();

    // Show success message
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    setLoading(false);
  }, [preferences, userId, savePreferences]);

  // Handle toggle
  const handleToggle = useCallback(
    (key: keyof typeof preferences) => (checked: boolean) => {
      setPreferences(prev => ({ ...prev, [key]: checked }));
    },
    []
  );

  // Handle change
  const handleChange = useCallback(
    (key: keyof typeof preferences) => (value: any) => {
      setPreferences(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  // Render
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notification Preferences
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage how you receive notifications
              </p>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin rounded-full" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Saved!</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Delivery Methods */}
        <PreferenceSection
          title="Delivery Methods"
          icon={<Mail className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-4">
            <TogglePreference
              label="Email Notifications"
              description="Receive notifications via email"
              checked={preferences.emailEnabled}
              onChange={handleToggle('emailEnabled')}
            />
            <TogglePreference
              label="Push Notifications"
              description="Receive push notifications on your device"
              checked={preferences.pushEnabled}
              onChange={handleToggle('pushEnabled')}
            />
            <TogglePreference
              label="In-App Notifications"
              description="Show notifications within the app"
              checked={preferences.inAppEnabled}
              onChange={handleToggle('inAppEnabled')}
            />
          </div>
        </PreferenceSection>

        {/* Quiet Hours */}
        <PreferenceSection
          title="Quiet Hours"
          icon={<Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-4">
            <TogglePreference
              label="Enable Quiet Hours"
              description="Mute notifications during specific hours"
              checked={preferences.quietHoursEnabled}
              onChange={handleToggle('quietHoursEnabled')}
            />
            {preferences.quietHoursEnabled && (
              <div className="pl-4 space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300 w-32">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300 w-32">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                </div>
                <div className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                  {preferences.quietHoursStart} - {preferences.quietHoursEnd}
                </div>
              </div>
            </div>
          )}
        </PreferenceSection>

        {/* Sound Settings */}
        <PreferenceSection
          title="Sound"
          icon={<Volume2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-4">
            <TogglePreference
              label="Notification Sounds"
              description="Play sounds for new notifications"
              checked={preferences.soundEnabled}
              onChange={handleToggle('soundEnabled')}
            />
            <div className="flex items-center gap-3 pl-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-24">
                Sound
              </label>
              <select
                value={preferences.notificationSound}
                onChange={(e) => handleChange('notificationSound', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="default">Default</option>
                <option value="chime">Chime</option>
                <option value="bell">Bell</option>
                <option value="ping">Ping</option>
                <option value="pop">Pop</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <label className="text-sm text-gray-700 dark:text-gray-300 w-20">
                Volume
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.volume}
                onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-8 ml-2">
                {preferences.volume}%
              </span>
            </div>
          </div>
        </PreferenceSection>

        {/* Notification Types */}
        <PreferenceSection
          title="Notification Types"
          icon={<Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Matter Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.matterNotifications}
                  onChange={(e) => handleToggle('matterNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.matterNotifications
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.matterNotifications && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Transaction Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.transactionNotifications}
                  onChange={(e) => handleToggle('transactionNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.transactionNotifications
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.transactionNotifications && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Interest Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.interestNotifications}
                  onChange={(e) => handleToggle('interestNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.interestNotifications
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.interestNotifications && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Report Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.reportNotifications}
                  onChange={(e) => handleToggle('reportNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.reportNotifications
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.reportNotifications && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                User Mentions
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.userMentions}
                  onChange={(e) => handleToggle('userMentions', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.userMentions
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.userMentions && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                System Notifications
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.systemNotifications}
                  onChange={(e) => handleToggle('systemNotifications', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                    preferences.systemNotifications
                      ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                      : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.systemNotifications && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
              </label>
            </div>
          </div>
        </PreferenceSection>

        {/* Priority Settings */}
        <PreferenceSection
          title="Priority"
          icon={<AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        >
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.highPriorityOnly}
                onChange={(e) => handleToggle('highPriorityOnly', e.target.checked)}
                className="sr-only"
              />
              <div className="flex items-center gap-3">
                <div className={`w-11 h-6 rounded-full border-2 transition-colors ${
                  preferences.highPriorityOnly
                    ? 'bg-orange-600 dark:bg-orange-500 border-orange-600 dark:border-orange-500'
                    : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
                  }`}>
                  {preferences.highPriorityOnly && (
                    <Check className="h-3.5 w-3.5 text-white ml-2" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  High Priority Only
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Only show high priority notifications
                </span>
              </div>
            </label>
          </div>
        </PreferenceSection>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={() => {
            // Reset to defaults
            const defaults = {
              emailEnabled: true,
              pushEnabled: true,
              inAppEnabled: true,
              soundEnabled: true,
              quietHoursEnabled: false,
              quietHoursStart: '22:00',
              quietHoursEnd: '08:00',
              matterNotifications: true,
              transactionNotifications: true,
              interestNotifications: true,
              reportNotifications: true,
              userMentions: true,
              systemNotifications: true,
              highPriorityOnly: false,
              notificationSound: 'default',
              volume: 75,
            };
            setPreferences(defaults);
            handleSave();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function PreferenceSection({ title, icon, children }: PreferenceSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TogglePreference({
  label,
  description,
  checked,
  onChange,
}: TogglePreferenceProps) {
  return (
    <div className="flex items-start gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
            checked
              ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
              : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
          }`}>
          {checked && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </label>
    </div>
  );
}

function PreferenceOption({
  label,
  value,
  onChange,
  checked,
}: TogglePreferenceProps & { value: any }) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="radio"
          checked={checked}
          onChange={() => onChange(value)}
          className="sr-only"
        />
        <div className={`w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center ${
            checked
              ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
              : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'
          }`}>
          {checked && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
      </label>
      <div className="text-sm text-gray-900 dark:text-white">{label}</div>
    </div>
  );
}
