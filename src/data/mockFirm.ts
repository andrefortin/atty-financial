// Mock firm data for ATTY Financial prototype

import { Firm } from '../types';

export const mockFirm: Firm = {
  id: 'firm-001',
  name: 'Smith & Associates, P.C.',
  contactEmail: 'finance@smithlaw.com',
  contactPhone: '(555) 123-4567',
  address: '123 Legal Plaza, Suite 500, New York, NY 10001',
  logoUrl: '/logo-placeholder.svg',
  primeRateModifier: 2.5, // +2.5% over prime
  lineOfCreditLimit: 5000000, // $5,000,000
  createdAt: new Date('2024-01-15'),
  settings: {
    dayCountConvention: 'ACT/360',
    roundingMethod: 'Standard',
    complianceCertified: true,
    complianceCertifiedAt: new Date('2024-01-15'),
    complianceCertifiedBy: 'John Smith',
  },
};

export const mockDashboardSummary = {
  totalPrincipalBalance: 1245890.50,
  totalInterestAccrued: 85420.75,
  activeMattersCount: 42,
  currentEffectiveRate: 11.0, // Prime 8.5% + Modifier 2.5%
  nextAutodraftDate: new Date('2024-04-15'),
  nextAutodraftAmount: 7540.25,
  unassignedTransactionsCount: 3,
  overdueMattersCount: 2,
};

export const mockRateCalendar = [
  {
    id: 'rate-001',
    effectiveDate: new Date('2024-01-01'),
    primeRate: 8.5,
    modifier: 2.5,
    totalRate: 11.0,
    source: 'Federal Reserve',
    notes: 'Initial rate setup',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'rate-002',
    effectiveDate: new Date('2024-02-15'),
    primeRate: 8.75,
    modifier: 2.5,
    totalRate: 11.25,
    source: 'Federal Reserve',
    notes: 'Prime rate increase',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'rate-003',
    effectiveDate: new Date('2024-03-20'),
    primeRate: 8.5,
    modifier: 2.5,
    totalRate: 11.0,
    source: 'Federal Reserve',
    notes: 'Prime rate decrease',
    createdAt: new Date('2024-03-20'),
  },
];
