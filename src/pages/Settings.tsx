import React, { useState } from 'react';
import { useFirmStore } from '../store/useFirmStore';
import { cn } from '../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tab } from './settings/Tab';
import { FirmSettings } from './settings/FirmSettings';
import { RateCalendarPage } from './RateCalendar';
import { Preferences } from './settings/Preferences';

type SettingsTab = 'firm' | 'rate-calendar' | 'preferences';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('firm');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
        <p className="text-gray-600">Manage your firm settings, rate calendar, and preferences</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-2">
          <Tab
            id="firm"
            label="Firm Settings"
            icon="BuildingOffice"
            isActive={activeTab === 'firm'}
            onTabChange={setActiveTab}
          />
          <Tab
            id="rate-calendar"
            label="Rate Calendar"
            icon="CalendarToday"
            isActive={activeTab === 'rate-calendar'}
            onTabChange={setActiveTab}
          />
          <Tab
            id="preferences"
            label="Preferences"
            icon="Settings"
            isActive={activeTab === 'preferences'}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'firm' && <FirmSettings />}
        {activeTab === 'rate-calendar' && <RateCalendarPage />}
        {activeTab === 'preferences' && <Preferences />}
      </div>
    </div>
  );
};

export default SettingsPage;
