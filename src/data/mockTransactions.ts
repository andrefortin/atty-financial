// Mock transactions data for ATTY Financial prototype

import { Transaction } from '../types';

export const mockTransactions: Transaction[] = [
  // Most recent transactions (unassigned)
  {
    id: 'TXN-2024-03-20-001',
    date: new Date('2024-03-20'),
    type: 'Draw',
    category: 'Medical Records & Related Costs',
    amount: 2500.00,
    netAmount: 2500.00,
    status: 'Unassigned',
    description: 'Medical records request',
    createdAt: new Date('2024-03-20'),
    allocations: [],
  },
  {
    id: 'TXN-2024-03-19-002',
    date: new Date('2024-03-19'),
    type: 'Draw',
    category: 'Expert Witness Fees',
    amount: 8500.00,
    netAmount: 8500.00,
    status: 'Unassigned',
    description: 'Dr. Smith expert witness fee',
    createdAt: new Date('2024-03-19'),
    allocations: [],
  },
  {
    id: 'TXN-2024-03-18-003',
    date: new Date('2024-03-18'),
    type: 'Draw',
    category: 'Court & Filing Fees',
    amount: 450.00,
    netAmount: 450.00,
    status: 'Unassigned',
    description: 'Filing fees for Johnson case',
    createdAt: new Date('2024-03-18'),
    allocations: [],
  },
  // Recent draws (assigned)
  {
    id: 'TXN-2024-03-15-004',
    date: new Date('2024-03-15'),
    type: 'Draw',
    category: 'Depositions & Transcripts',
    amount: 12000.00,
    netAmount: 12000.00,
    status: 'Assigned',
    description: 'Multiple deposition costs',
    createdAt: new Date('2024-03-15'),
    allocations: [
      { matterId: 'JON-2024-001', matterName: 'Johnathan Smithson', amount: 5000.00 },
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 7000.00 },
    ],
  },
  {
    id: 'TXN-2024-03-14-005',
    date: new Date('2024-03-14'),
    type: 'Draw',
    category: 'Investigation & Evidence',
    amount: 6500.00,
    netAmount: 6500.00,
    status: 'Assigned',
    description: 'Private investigation services',
    createdAt: new Date('2024-03-14'),
    allocations: [
      { matterId: 'WIL-2024-007', matterName: 'William Johnson', amount: 6500.00 },
    ],
  },
  {
    id: 'TXN-2024-03-12-006',
    date: new Date('2024-03-12'),
    type: 'Draw',
    category: 'Medical Records & Related Costs',
    amount: 3200.00,
    netAmount: 3200.00,
    status: 'Assigned',
    description: 'Medical records subpoena',
    createdAt: new Date('2024-03-12'),
    allocations: [
      { matterId: 'THO-2024-005', matterName: 'Thomas Anderson', amount: 3200.00 },
    ],
  },
  // Principal payment
  {
    id: 'TXN-2024-03-10-007',
    date: new Date('2024-03-10'),
    type: 'Principal Payment',
    category: 'Principal Payment/Adjustment',
    amount: 25000.00,
    netAmount: -25000.00,
    status: 'Assigned',
    description: 'Principal payment - multiple cases',
    createdAt: new Date('2024-03-10'),
    allocations: [
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 15000.00 },
      { matterId: 'JAM-2023-045', matterName: 'James Taylor', amount: 10000.00 },
    ],
  },
  {
    id: 'TXN-2024-03-08-008',
    date: new Date('2024-03-08'),
    type: 'Draw',
    category: 'Travel & Trial Preparation',
    amount: 5400.00,
    netAmount: 5400.00,
    status: 'Assigned',
    description: 'Travel expenses for trial preparation',
    createdAt: new Date('2024-03-08'),
    allocations: [
      { matterId: 'BAR-2024-002', matterName: 'Barbara Wilson', amount: 5400.00 },
    ],
  },
  // Interest autodraft (allocated)
  {
    id: 'TXN-2024-03-01-009',
    date: new Date('2024-03-01'),
    type: 'Interest Autodraft',
    category: 'Monthly Interest Draft',
    amount: 7540.25,
    netAmount: -7540.25,
    status: 'Allocated',
    description: 'Monthly interest autodraft',
    createdAt: new Date('2024-03-01'),
    allocations: [
      { matterId: 'JON-2024-001', matterName: 'Johnathan Smithson', amount: 750.00 },
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 1875.00 },
      { matterId: 'WIL-2024-007', matterName: 'William Johnson', amount: 420.00 },
      { matterId: 'BAR-2024-002', matterName: 'Barbara Wilson', amount: 625.00 },
      { matterId: 'THO-2024-005', matterName: 'Thomas Anderson', amount: 250.00 },
      { matterId: 'JAM-2023-045', matterName: 'James Taylor', amount: 1500.00 },
      { matterId: 'SAR-2024-008', matterName: 'Sarah Connor', amount: 125.00 },
      { matterId: 'LIS-2024-004', matterName: 'Lisa Chen', amount: 180.00 },
      { matterId: 'ROB-2024-006', matterName: 'Robert Davis', amount: 320.00 },
      { matterId: 'PAT-2023-028', matterName: 'Patricia Moore', amount: 1495.25 },
    ],
  },
  // Earlier transactions
  {
    id: 'TXN-2024-02-28-010',
    date: new Date('2024-02-28'),
    type: 'Draw',
    category: 'Expert Witness Fees',
    amount: 15000.00,
    netAmount: 15000.00,
    status: 'Assigned',
    description: 'Expert witness retainer',
    createdAt: new Date('2024-02-28'),
    allocations: [
      { matterId: 'JAM-2023-045', matterName: 'James Taylor', amount: 15000.00 },
    ],
  },
  {
    id: 'TXN-2024-02-25-011',
    date: new Date('2024-02-25'),
    type: 'Draw',
    category: 'Discovery & Document Production',
    amount: 22500.00,
    netAmount: 22500.00,
    status: 'Assigned',
    description: 'Document discovery costs',
    createdAt: new Date('2024-02-25'),
    allocations: [
      { matterId: 'LIS-2024-004', matterName: 'Lisa Chen', amount: 22500.00 },
    ],
  },
  {
    id: 'TXN-2024-02-20-012',
    date: new Date('2024-02-20'),
    type: 'Draw',
    category: 'Service of Process',
    amount: 1800.00,
    netAmount: 1800.00,
    status: 'Assigned',
    description: 'Process server fees',
    createdAt: new Date('2024-02-20'),
    allocations: [
      { matterId: 'THO-2024-005', matterName: 'Thomas Anderson', amount: 1800.00 },
    ],
  },
  // February interest autodraft
  {
    id: 'TXN-2024-02-01-013',
    date: new Date('2024-02-01'),
    type: 'Interest Autodraft',
    category: 'Monthly Interest Draft',
    amount: 7245.50,
    netAmount: -7245.50,
    status: 'Allocated',
    description: 'Monthly interest autodraft',
    createdAt: new Date('2024-02-01'),
    allocations: [
      { matterId: 'JON-2024-001', matterName: 'Johnathan Smithson', amount: 600.00 },
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 1750.00 },
      { matterId: 'WIL-2024-007', matterName: 'William Johnson', amount: 380.00 },
      { matterId: 'BAR-2024-002', matterName: 'Barbara Wilson', amount: 600.00 },
      { matterId: 'THO-2024-005', matterName: 'Thomas Anderson', amount: 150.00 },
      { matterId: 'JAM-2023-045', matterName: 'James Taylor', amount: 1250.00 },
      { matterId: 'MIL-2024-001', matterName: 'Millicent Brown', amount: 450.00 },
      { matterId: 'PAT-2023-028', matterName: 'Patricia Moore', amount: 2065.50 },
    ],
  },
  // Earlier draws
  {
    id: 'TXN-2024-01-28-014',
    date: new Date('2024-01-28'),
    type: 'Draw',
    category: 'Mediation & Arbitration',
    amount: 25000.00,
    netAmount: 25000.00,
    status: 'Assigned',
    description: 'Mediation costs',
    createdAt: new Date('2024-01-28'),
    allocations: [
      { matterId: 'PAT-2023-028', matterName: 'Patricia Moore', amount: 25000.00 },
    ],
  },
  {
    id: 'TXN-2024-01-25-015',
    date: new Date('2024-01-25'),
    type: 'Draw',
    category: 'Medical Records & Related Costs',
    amount: 15000.00,
    netAmount: 15000.00,
    status: 'Assigned',
    description: 'Medical records subpoena',
    createdAt: new Date('2024-01-25'),
    allocations: [
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 15000.00 },
    ],
  },
  {
    id: 'TXN-2024-01-20-016',
    date: new Date('2024-01-20'),
    type: 'Draw',
    category: 'Witness Costs',
    amount: 8500.00,
    netAmount: 8500.00,
    status: 'Assigned',
    description: 'Witness subpoena and expenses',
    createdAt: new Date('2024-01-20'),
    allocations: [
      { matterId: 'JON-2024-001', matterName: 'Johnathan Smithson', amount: 8500.00 },
    ],
  },
  // January interest autodraft
  {
    id: 'TXN-2024-01-01-017',
    date: new Date('2024-01-01'),
    type: 'Interest Autodraft',
    category: 'Monthly Interest Draft',
    amount: 6890.00,
    netAmount: -6890.00,
    status: 'Allocated',
    description: 'Monthly interest autodraft',
    createdAt: new Date('2024-01-01'),
    allocations: [
      { matterId: 'JON-2024-001', matterName: 'Johnathan Smithson', amount: 800.00 },
      { matterId: 'DOD-2024-003', matterName: 'Dorothy Martinez', amount: 1600.00 },
      { matterId: 'JAM-2023-045', matterName: 'James Taylor', amount: 1250.00 },
      { matterId: 'PAT-2023-028', matterName: 'Patricia Moore', amount: 3240.00 },
    ],
  },
];

// Get unassigned transactions
export const getUnassignedTransactions = () =>
  mockTransactions.filter((t) => t.status === 'Unassigned');

// Get transactions by type
export const getTransactionsByType = (type: string) =>
  mockTransactions.filter((t) => t.type === type);

// Get recent transactions (last 10)
export const getRecentTransactions = () =>
  [...mockTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
