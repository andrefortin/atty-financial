// Navigation constants for ATTY Financial Application

export interface NavItem {
  id: string;
  label: string;
  icon: 'LayoutDashboard' | 'Briefcase' | 'Receipt' | 'FileText' | 'Calculator' | 'PieChart' | 'Settings' | 'AlertCircle' | 'TrendingUp' | 'RefreshCw' | 'Database' | 'DollarSign';
  path: string;
  badge?: number;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
  },
  {
    id: 'matters',
    label: 'Matters',
    icon: 'Briefcase',
    path: '/matters',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'Receipt',
    path: '/transactions',
  },
  {
    id: 'bank-feed',
    label: 'Bank Feed',
    icon: 'Database',
    path: '/bank-feed',
  },
  {
    id: 'interest-allocation',
    label: 'Interest Allocation',
    icon: 'DollarSign',
    path: '/interest-allocation',
  },
  {
    id: 'calculators',
    label: 'Calculators',
    icon: 'Calculator',
    path: '/calculators',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'FileText',
    path: '/reports',
  },
  {
    id: 'rate-calendar',
    label: 'Rate Calendar',
    icon: 'TrendingUp',
    path: '/rate-calendar',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: 'AlertCircle',
    path: '/alerts',
    badge: 3,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    path: '/settings',
  },
];

// Special routes (not in main navigation)
export const SPECIAL_ROUTES = {
  matterDetail: '/matters/:id',
};

// Additional navigation items for dropdowns or sidebars
export const REPORT_SUB_ITEMS = [
  { id: 'firm-payoff', label: 'Firm Payoff', path: '/reports' },
  { id: 'client-payoff', label: 'Client Payoff', path: '/reports' },
  { id: 'funding', label: 'Funding Report', path: '/reports' },
  { id: 'finance-charge', label: 'Finance Charge', path: '/reports' },
];

export const CALCULATOR_SUB_ITEMS = [
  { id: 'draw', label: 'Draw Calculator', path: '/calculators' },
  { id: 'payoff', label: 'Payoff Calculator', path: '/calculators' },
];
