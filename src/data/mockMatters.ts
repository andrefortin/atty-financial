// Mock matters data for ATTY Financial prototype

import { Matter } from '../types';

export const mockMatters: Matter[] = [
  {
    id: 'JON-2024-001',
    clientName: 'Johnathan Smithson',
    status: 'Active',
    notes: 'Personal injury case - motor vehicle accident',
    createdAt: new Date('2024-01-10'),
    totalDraws: 45600.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 2150.75,
    interestPaid: 750.00,
    principalBalance: 45600.00,
    totalOwed: 47750.75,
  },
  {
    id: 'DOD-2024-003',
    clientName: 'Dorothy Martinez',
    status: 'Active',
    notes: 'Medical malpractice - surgical error',
    createdAt: new Date('2024-01-15'),
    totalDraws: 125000.00,
    totalPrincipalPayments: 25000.00,
    totalInterestAccrued: 5845.50,
    interestPaid: 1875.00,
    principalBalance: 100000.00,
    totalOwed: 105845.50,
  },
  {
    id: 'WIL-2024-007',
    clientName: 'William Johnson',
    status: 'Active',
    notes: 'Wrongful termination lawsuit',
    createdAt: new Date('2024-02-01'),
    totalDraws: 32000.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 890.25,
    interestPaid: 0,
    principalBalance: 32000.00,
    totalOwed: 32890.25,
  },
  {
    id: 'BAR-2024-002',
    clientName: 'Barbara Wilson',
    status: 'Active',
    notes: 'Product liability - defective equipment',
    createdAt: new Date('2024-02-10'),
    totalDraws: 67800.00,
    totalPrincipalPayments: 15000.00,
    totalInterestAccrued: 1250.50,
    interestPaid: 625.00,
    principalBalance: 52800.00,
    totalOwed: 54050.50,
  },
  {
    id: 'THO-2024-005',
    clientName: 'Thomas Anderson',
    status: 'Active',
    notes: 'Construction accident case',
    createdAt: new Date('2024-02-20'),
    totalDraws: 28500.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 420.00,
    interestPaid: 0,
    principalBalance: 28500.00,
    totalOwed: 28920.00,
  },
  {
    id: 'MIL-2024-001',
    clientName: 'Millicent Brown',
    status: 'Closed',
    notes: 'Slip and fall - premises liability',
    createdAt: new Date('2024-01-05'),
    closedAt: new Date('2024-02-28'),
    totalDraws: 18000.00,
    totalPrincipalPayments: 18000.00,
    totalInterestAccrued: 450.00,
    interestPaid: 450.00,
    principalBalance: 0,
    totalOwed: 0,
  },
  {
    id: 'JAM-2023-045',
    clientName: 'James Taylor',
    status: 'Active',
    notes: 'Motorcycle accident case',
    createdAt: new Date('2023-12-15'),
    totalDraws: 89500.00,
    totalPrincipalPayments: 20000.00,
    totalInterestAccrued: 6875.25,
    interestPaid: 1500.00,
    principalBalance: 69500.00,
    totalOwed: 76375.25,
  },
  {
    id: 'SAR-2024-008',
    clientName: 'Sarah Connor',
    status: 'Active',
    notes: 'Workplace injury case',
    createdAt: new Date('2024-03-01'),
    totalDraws: 15000.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 125.00,
    interestPaid: 0,
    principalBalance: 15000.00,
    totalOwed: 15125.00,
  },
  {
    id: 'MIC-2023-033',
    clientName: 'Michael Reynolds',
    status: 'Closed',
    notes: 'Nursing home negligence case',
    createdAt: new Date('2023-11-20'),
    closedAt: new Date('2024-01-15'),
    totalDraws: 42000.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 950.00,
    interestPaid: 950.00,
    principalBalance: 42000.00,
    totalOwed: 42950.00,
  },
  {
    id: 'LIS-2024-004',
    clientName: 'Lisa Chen',
    status: 'Active',
    notes: 'Medical device injury case',
    createdAt: new Date('2024-02-25'),
    totalDraws: 22500.00,
    totalPrincipalPayments: 0,
    totalInterestAccrued: 180.00,
    interestPaid: 0,
    principalBalance: 22500.00,
    totalOwed: 22680.00,
  },
  {
    id: 'ROB-2024-006',
    clientName: 'Robert Davis',
    status: 'Active',
    notes: 'Trucking accident case',
    createdAt: new Date('2024-03-05'),
    totalDraws: 56000.00,
    totalPrincipalPayments: 10000.00,
    totalInterestAccrued: 320.00,
    interestPaid: 0,
    principalBalance: 46000.00,
    totalOwed: 46320.00,
  },
  {
    id: 'PAT-2023-028',
    clientName: 'Patricia Moore',
    status: 'Active',
    notes: 'Defective medical product case',
    createdAt: new Date('2023-10-10'),
    totalDraws: 156000.00,
    totalPrincipalPayments: 45000.00,
    totalInterestAccrued: 12500.50,
    interestPaid: 3500.00,
    principalBalance: 111000.00,
    totalOwed: 123500.50,
  },
];

// Matter alerts (matters with overdue principal)
export const mockMatterAlerts = [
  {
    matterId: 'MIC-2023-033',
    clientName: 'Michael Reynolds',
    daysSinceClosure: 48, // Closed 48 days ago
    principalBalance: 42000.00,
    alertLevel: 'Error' as const,
  },
  {
    matterId: 'MIL-2024-001',
    clientName: 'Millicent Brown',
    daysSinceClosure: 25, // Closed 25 days ago
    principalBalance: 0, // No balance, just showing the alert
    alertLevel: 'Warning' as const,
  },
];

// Active matters for calculators
export const getActiveMatters = () => mockMatters.filter((m) => m.status === 'Active');

// Overdue matters
export const getOverdueMatters = () =>
  mockMatters.filter(
    (m) =>
      m.status === 'Closed' &&
      m.closedAt &&
      m.principalBalance > 0 &&
      daysSinceClosure(m.closedAt) >= 20
  );

function daysSinceClosure(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
