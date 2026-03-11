# ATTY Financial - Project Structure Plan

## Directory Structure

```
atty-financial/
├── public/                      # Static assets
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── ui/                 # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Toast.tsx
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── UnassignedTransactions.tsx
│   │   │   └── AlertBanner.tsx
│   │   ├── matters/           # Matter components
│   │   │   ├── MattersTable.tsx
│   │   │   ├── MatterCard.tsx
│   │   │   ├── AddMatterModal.tsx
│   │   │   └── MatterDetail.tsx
│   │   ├── transactions/      # Transaction components
│   │   │   ├── TransactionsTable.tsx
│   │   │   ├── AllocateModal.tsx
│   │   │   └── TransactionFilters.tsx
│   │   ├── calculators/       # Calculator components
│   │   │   ├── DrawCalculator.tsx
│   │   │   └── PayoffCalculator.tsx
│   │   ├── reports/           # Report components
│   │   │   ├── FirmPayoffReport.tsx
│   │   │   ├── ClientPayoffReport.tsx
│   │   │   ├── FundingReport.tsx
│   │   │   └── FinanceChargeReport.tsx
│   │   └── settings/          # Settings components
│   │       ├── FirmProfile.tsx
│   │       ├── RateCalendar.tsx
│   │       └── ComplianceCertification.tsx
│   │
│   ├── pages/                 # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Matters.tsx
│   │   ├── MatterDetail.tsx
│   │   ├── Transactions.tsx
│   │   ├── Calculators.tsx
│   │   ├── Reports.tsx
│   │   ├── InterestAllocation.tsx
│   │   └── Settings.tsx
│   │
│   ├── services/              # Business logic
│   │   ├── interestCalculator.ts
│   │   ├── allocationService.ts
│   │   ├── reportGenerator.ts
│   │   └── validationService.ts
│   │
│   ├── store/                 # State management
│   │   ├── index.ts
│   │   ├── matterStore.ts
│   │   ├── transactionStore.ts
│   │   ├── firmStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── matter.ts
│   │   ├── transaction.ts
│   │   ├── firm.ts
│   │   ├── allocation.ts
│   │   └── index.ts
│   │
│   ├── utils/                 # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── dateUtils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useMatters.ts
│   │   ├── useTransactions.ts
│   │   ├── useInterest.ts
│   │   └── useReports.ts
│   │
│   ├── data/                  # Mock data for demo
│   │   ├── mockMatters.ts
│   │   ├── mockTransactions.ts
│   │   ├── mockFirm.ts
│   │   └── mockRates.ts
│   │
│   ├── styles/                # Global styles
│   │   ├── globals.css
│   │   └── theme.css
│   │
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts          # Vite type definitions
│
├── docs/                      # Documentation (existing)
│
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Key Files to Create

### Phase 1: Foundation
1. `src/types/index.ts` - All TypeScript interfaces
2. `src/utils/constants.ts` - Brand colors, categories, etc.
3. `src/utils/formatters.ts` - Currency, date, number formatting
4. `src/components/layout/Layout.tsx` - Main layout
5. `src/components/layout/Header.tsx` - Header component
6. `src/components/layout/Sidebar.tsx` - Navigation sidebar
7. `src/App.tsx` - Main app with routing
8. `src/pages/Dashboard.tsx` - Dashboard page
9. `src/styles/globals.css` - Global styles

### Phase 2: Core Components
10. `src/components/ui/` - All basic UI components
11. `src/store/index.ts` - Zustand store setup
12. `src/data/mockMatters.ts` - Mock matter data
13. `src/data/mockTransactions.ts` - Mock transaction data
14. `src/data/mockFirm.ts` - Mock firm data
15. `src/services/interestCalculator.ts` - Interest calculation logic
16. `src/pages/Matters.tsx` - Matters page
17. `src/pages/Transactions.tsx` - Transactions page

### Phase 3: Advanced Features
18. `src/services/allocationService.ts` - Interest allocation logic
19. `src/components/calculators/` - Calculator components
20. `src/components/reports/` - Report generation components
21. `src/pages/Calculators.tsx` - Calculators page
22. `src/pages/Reports.tsx` - Reports page
23. `src/pages/InterestAllocation.tsx` - Interest allocation page

### Phase 4: Polish
24. `src/components/settings/` - Settings components
25. `src/pages/Settings.tsx` - Settings page
26. `src/services/reportGenerator.ts` - Report generation service
27. `src/services/validationService.ts` - Validation logic
28. `src/hooks/` - Custom hooks

## Development Order

1. **Setup & Types** (Day 1)
   - Install dependencies
   - Configure Tailwind
   - Define all TypeScript interfaces
   - Set up constants and formatters

2. **Layout & Navigation** (Day 1-2)
   - Create main layout structure
   - Build header and sidebar
   - Set up routing
   - Create navigation state

3. **Dashboard** (Day 2-3)
   - Build dashboard layout
   - Create summary cards
   - Build unassigned transactions table
   - Add alert banner

4. **Matters Management** (Day 3-4)
   - Create matters table
   - Build add/edit matter forms
   - Implement matter detail view
   - Add validation

5. **Transactions** (Day 4-5)
   - Create transactions table with filters
   - Build allocation modal
   - Implement transaction categorization

6. **Interest Engine** (Day 5-6)
   - Build interest calculator service
   - Implement rate calendar
   - Add interest calculation to matter balances

7. **Calculators** (Day 6-7)
   - Build draw calculator
   - Build payoff calculator
   - Add matching functionality

8. **Reports** (Day 7-8)
   - Build report generation service
   - Create firm payoff report
   - Create client payoff report
   - Add export functionality

9. **Settings & Polish** (Day 8-9)
   - Build settings pages
   - Add compliance certification
   - Implement admin functions
   - Add error handling and loading states

10. **Testing & Deployment** (Day 10)
    - Test all workflows
    - Fix bugs
    - Optimize performance
    - Deploy to Vercel
