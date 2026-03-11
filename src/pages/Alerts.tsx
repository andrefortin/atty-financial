import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  XCircle,
  Mail,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertSystem } from '../components/alerts/AlertSystem';

// ============================================
// Alerts Page Component
// ============================================

export const Alerts: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <a href="/" className="hover:text-black dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Alerts</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Alerts & Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor overdue matters, track approaching deadlines, and manage system notifications
        </p>
      </div>

      {/* Alert System Component */}
      <AlertSystem />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Critical Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Matters requiring immediate attention, such as overdue balances beyond 
                  30-day threshold or critical payment issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Warning Alerts</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Matters approaching deadlines or with overdue balances between 20-30 days. 
                  Take action to prevent escalation to critical.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Alert Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 dark:bg-red-600"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Critical</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                Immediate action required. Overdue matters beyond 30 days or critical issues.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 dark:bg-yellow-600"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Warning</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                Attention needed soon. Overdue 20-30 days or approaching deadlines.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-black dark:bg-white"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Info</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                For your information. Rate changes, system updates, reminders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
