import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn, formatCurrency, formatDate, formatDaysAgo } from '../../utils/formatters';

// ============================================
// Types for Alert System
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  description: string;
  matterId?: string;
  clientName?: string;
  amount?: number;
  date: Date;
  acknowledged: boolean;
}

export interface AlertSettings {
  enableEmailNotifications: boolean;
  emailRecipients: string[];
  overdueThresholdDays: number;
  utilizationThresholdPercent: number;
}

// ============================================
// Alert System Component
// ============================================

interface AlertSystemProps {
  className?: string;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ className }) => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      severity: 'critical',
      type: 'overdue',
      title: 'Overdue Matter',
      description: 'Matter M003 (Robert Johnson) has outstanding principal balance of $125,000 for 35 days past closure.',
      matterId: 'M003',
      clientName: 'Robert Johnson',
      amount: 125000,
      date: new Date('2024-02-01'),
      acknowledged: false,
    },
    {
      id: '2',
      severity: 'critical',
      type: 'overdue',
      title: 'Overdue Matter',
      description: 'Matter M005 (Michael Wilson) has outstanding principal balance of $89,000 for 32 days past closure.',
      matterId: 'M005',
      clientName: 'Michael Wilson',
      amount: 89000,
      date: new Date('2024-02-04'),
      acknowledged: false,
    },
    {
      id: '3',
      severity: 'warning',
      type: 'approaching',
      title: 'Approaching Due Date',
      description: 'Matter M002 (Jane Doe) will reach 20-day threshold in 3 days.',
      matterId: 'M002',
      clientName: 'Jane Doe',
      amount: 75000,
      date: new Date('2024-03-05'),
      acknowledged: false,
    },
    {
      id: '4',
      severity: 'info',
      type: 'rate-change',
      title: 'Rate Change Effective',
      description: 'Interest rate change from 9.0% to 9.25% is effective today.',
      date: new Date(),
      acknowledged: false,
    },
    {
      id: '5',
      severity: 'warning',
      type: 'utilization',
      title: 'High Credit Utilization',
      description: 'Line of credit utilization is at 42.4%. Consider reviewing funding needs.',
      amount: 424000,
      date: new Date('2024-03-10'),
      acknowledged: false,
    },
  ]);

  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('severity');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AlertSettings>({
    enableEmailNotifications: true,
    emailRecipients: ['admin@smithlaw.com'],
    overdueThresholdDays: 20,
    utilizationThresholdPercent: 80,
  });

  // Filter and sort alerts
  const filteredAlerts = React.useMemo(() => {
    let filtered = [...alerts];
    
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === filterSeverity);
    }
    
    // Sort by severity then date
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        return severityOrder[a.severity] - severityOrder[b.severity];
      } else {
        return b.date.getTime() - a.date.getTime();
      }
    });
    
    return filtered;
  }, [alerts, filterSeverity, sortBy]);

  const summary = React.useMemo(() => {
    return {
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      total: alerts.length,
    };
  }, [alerts]);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(a => a.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleAcknowledgeAll = () => {
    setAlerts(a => a.map(alert => ({ ...alert, acknowledged: true })));
  };

  const handleDismiss = (alertId: string) => {
    setAlerts(a => a.filter(alert => alert.id !== alertId));
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-error text-white';
      case 'warning':
        return 'bg-warning text-gray-900';
      case 'info':
        return 'bg-black text-white';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn('border-l-4', summary.critical > 0 ? 'border-l-error' : 'border-l-gray-300')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</p>
                <p className="text-3xl font-bold text-error">{summary.critical}</p>
              </div>
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</p>
                <p className="text-3xl font-bold text-warning">{summary.warning}</p>
              </div>
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Info</p>
                <p className="text-3xl font-bold text-black">{summary.info}</p>
              </div>
              <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Alerts</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Hide History' : 'View History'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Severity:</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(['all', 'critical', 'warning', 'info'] as const).map((severity) => (
                  <button
                    key={severity}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
                      filterSeverity === severity
                        ? 'bg-white text-black shadow'
                        : 'text-gray-600'
                    )}
                    onClick={() => setFilterSeverity(severity)}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select 
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
              >
                <option value="severity">Severity</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {/* Acknowledge All Button */}
          {filteredAlerts.some(a => !a.acknowledged) && (
            <div className="mb-4">
              <Button variant="primary" size="sm" onClick={handleAcknowledgeAll}>
                Acknowledge All
              </Button>
            </div>
          )}

          {/* Alert Items */}
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  alert.acknowledged ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', getSeverityColor(alert.severity))}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={cn('font-semibold', alert.acknowledged ? 'text-gray-500' : 'text-gray-900')}>
                        {alert.title}
                      </h4>
                      <span className="text-xs text-gray-500">{formatDaysAgo(alert.date)}</span>
                    </div>
                    <p className={cn('text-sm mb-2', alert.acknowledged ? 'text-gray-400' : 'text-gray-600')}>
                      {alert.description}
                    </p>
                    {alert.amount && (
                      <p className="text-sm font-medium text-black">
                        Amount: {formatCurrency(alert.amount)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {alert.matterId && (
                          <Badge variant="default" size="sm">
                            {alert.matterId}
                          </Badge>
                        )}
                        <Badge 
                          variant={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'} 
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button variant="secondary" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(alert.id)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Found</h3>
              <p className="text-gray-600">
                {filterSeverity === 'all' 
                  ? "Great! You're all caught up on alerts."
                  : `No ${filterSeverity} alerts found.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertSystem;
