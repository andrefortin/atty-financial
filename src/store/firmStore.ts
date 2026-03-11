// Firm Store - Zustand state management for firm and rate calendar
// Handles firm settings, line of credit, and rate calendar management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Firm,
  FirmSettings,
  RateEntry,
  DashboardSummary,
  InterestAllocation,
} from '../types';
import { mockFirm, mockRateCalendar, mockDashboardSummary } from '../data/mockFirm';

// ============================================
// State Interface
// ============================================

export interface FirmState {
  // Firm data
  firm: Firm;

  // Rate calendar
  rateCalendar: RateEntry[];

  // Dashboard summary (computed from other stores)
  dashboardSummary: DashboardSummary;

  // Interest allocations
  interestAllocations: InterestAllocation[];

  // Computed (getters)
  getCurrentRate: () => RateEntry | undefined;
  getRateForDate: (date: Date) => RateEntry | undefined;
  getHistoricalRates: () => RateEntry[];
  getEffectiveRate: () => number;
  getLineOfCreditRemaining: () => number;
  getLineOfCreditUsed: () => number;
  getLineOfCreditUsagePercentage: () => number;
  getTotalPrincipalBalance: () => number; // Will be from matterStore
  getAutodraftAmount: () => number;

  // Firm Actions
  updateFirm: (updates: Partial<Firm>) => void;
  updateFirmSettings: (settings: Partial<FirmSettings>) => void;
  updatePrimeRateModifier: (modifier: number) => void;
  updateLineOfCreditLimit: (limit: number) => void;
  setComplianceCertified: (certified: boolean, certifiedBy?: string) => void;

  // Rate Calendar Actions
  addRateEntry: (entry: Omit<RateEntry, 'id' | 'totalRate' | 'createdAt'>) => RateEntry;
  updateRateEntry: (id: string, updates: Partial<RateEntry>) => void;
  deleteRateEntry: (id: string) => void;
  setCurrentRate: (primeRate: number, notes?: string) => void;

  // Dashboard Actions
  updateDashboardSummary: (updates: Partial<DashboardSummary>) => void;

  // Interest Allocation Actions
  addInterestAllocation: (allocation: Omit<InterestAllocation, 'id'>) => void;
  getInterestAllocationByAutodraftId: (autodraftId: string) => InterestAllocation | undefined;

  // Reset
  reset: () => void;
}

// ============================================
// Store Definition
// ============================================

export const useFirmStore = create<FirmState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial data
        firm: mockFirm,
        rateCalendar: mockRateCalendar,
        dashboardSummary: mockDashboardSummary,
        interestAllocations: [],

        // ============================================
        // Getters / Computed State
        // ============================================

        getCurrentRate: () => {
          const { rateCalendar } = get();
          const now = new Date();
          return rateCalendar
            .filter((rate) => rate.effectiveDate <= now)
            .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
        },

        getRateForDate: (date) => {
          const { rateCalendar } = get();
          return rateCalendar
            .filter((rate) => rate.effectiveDate <= date)
            .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
        },

        getHistoricalRates: () => {
          const { rateCalendar } = get();
          return [...rateCalendar].sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());
        },

        getEffectiveRate: () => {
          const currentRate = get().getCurrentRate();
          return currentRate ? currentRate.totalRate : 0;
        },

        getLineOfCreditRemaining: () => {
          const { firm } = get();
          return firm.lineOfCreditLimit - get().getLineOfCreditUsed();
        },

        getLineOfCreditUsed: () => {
          // This would normally come from matterStore
          // For now, use the dashboard summary value
          return get().dashboardSummary.totalPrincipalBalance;
        },

        getLineOfCreditUsagePercentage: () => {
          const { firm } = get();
          if (firm.lineOfCreditLimit === 0) return 0;
          return (get().getLineOfCreditUsed() / firm.lineOfCreditLimit) * 100;
        },

        getTotalPrincipalBalance: () => {
          return get().dashboardSummary.totalPrincipalBalance;
        },

        getAutodraftAmount: () => {
          return get().dashboardSummary.nextAutodraftAmount;
        },

        // ============================================
        // Firm Actions
        // ============================================

        updateFirm: (updates) => {
          set((state) => ({
            firm: { ...state.firm, ...updates },
          }));
        },

        updateFirmSettings: (settings) => {
          set((state) => ({
            firm: {
              ...state.firm,
              settings: { ...state.firm.settings, ...settings },
            },
          }));
        },

        updatePrimeRateModifier: (modifier) => {
          set((state) => ({
            firm: { ...state.firm, primeRateModifier: modifier },
            // Update total rate for all current and future rate entries
            rateCalendar: state.rateCalendar.map((rate) => ({
              ...rate,
              modifier,
              totalRate: rate.primeRate + modifier,
            })),
          }));
        },

        updateLineOfCreditLimit: (limit) => {
          set((state) => ({
            firm: { ...state.firm, lineOfCreditLimit: limit },
          }));
        },

        setComplianceCertified: (certified, certifiedBy) => {
          set((state) => ({
            firm: {
              ...state.firm,
              settings: {
                ...state.firm.settings,
                complianceCertified: certified,
                complianceCertifiedAt: certified ? new Date() : undefined,
                complianceCertifiedBy: certified ? certifiedBy : undefined,
              },
            },
          }));
        },

        // ============================================
        // Rate Calendar Actions
        // ============================================

        addRateEntry: (entry) => {
          const id = `rate-${Date.now()}`;
          const { firm } = get();
          const totalRate = entry.primeRate + firm.primeRateModifier;

          const newEntry: RateEntry = {
            id,
            effectiveDate: entry.effectiveDate,
            primeRate: entry.primeRate,
            modifier: firm.primeRateModifier,
            totalRate,
            source: entry.source,
            notes: entry.notes,
            createdAt: new Date(),
          };

          set((state) => ({
            rateCalendar: [...state.rateCalendar, newEntry],
          }));

          return newEntry;
        },

        updateRateEntry: (id, updates) => {
          set((state) => ({
            rateCalendar: state.rateCalendar.map((entry) =>
              entry.id === id
                ? {
                    ...entry,
                    ...updates,
                    totalRate: updates.primeRate !== undefined
                      ? updates.primeRate + entry.modifier
                      : entry.totalRate,
                  }
                : entry
            ),
          }));
        },

        deleteRateEntry: (id) => {
          set((state) => ({
            rateCalendar: state.rateCalendar.filter((entry) => entry.id !== id),
          }));
        },

        setCurrentRate: (primeRate, notes) => {
          const { firm } = get();
          get().addRateEntry({
            effectiveDate: new Date(),
            primeRate,
            modifier: firm.primeRateModifier,
            source: 'Manual Entry',
            notes,
          });
        },

        // ============================================
        // Dashboard Actions
        // ============================================

        updateDashboardSummary: (updates) => {
          set((state) => ({
            dashboardSummary: { ...state.dashboardSummary, ...updates },
          }));
        },

        // ============================================
        // Interest Allocation Actions
        // ============================================

        addInterestAllocation: (allocation) => {
          const id = `alloc-${Date.now()}`;
          const newAllocation: InterestAllocation = {
            id,
            ...allocation,
          };

          set((state) => ({
            interestAllocations: [...state.interestAllocations, newAllocation],
          }));
        },

        getInterestAllocationByAutodraftId: (autodraftId) => {
          return get().interestAllocations.find((a) => a.autodraftId === autodraftId);
        },

        // ============================================
        // Reset
        // ============================================

        reset: () => {
          set({
            firm: mockFirm,
            rateCalendar: mockRateCalendar,
            dashboardSummary: mockDashboardSummary,
            interestAllocations: [],
          });
        },
      }),
      {
        name: 'atty-firm-storage',
        partialize: (state) => ({
          firm: state.firm,
          rateCalendar: state.rateCalendar,
          interestAllocations: state.interestAllocations,
        }),
      }
    ),
    { name: 'FirmStore' }
  )
);

// ============================================
// Store Composition with Matter Store
// ============================================

/**
 * Update dashboard summary with data from matter store
 * This would typically be called after matter/transaction updates
 */
export const syncDashboardSummary = () => {
  // This will be implemented when we connect stores
  // For now, the dashboard summary is managed directly
  // In a full implementation, this would aggregate data from matterStore and transactionStore
};
