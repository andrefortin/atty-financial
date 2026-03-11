# ATTY Financial Application - Design Document

## Project Overview

**Application Name:** ATTY Financial - Case Cost Line of Credit (CCLOC) Tracking Tool
**Target Users:** Law firms specializing in personal injury and tort law
**Primary Purpose:** Track line of credit draws, calculate daily interest at the client/matter level, and manage allocations across legal matters

---

## 1. Business Context

### Problem Statement
Law firms with case cost lines of credit need to:
- Track individual client/matter expenses from a master line of credit
- Calculate daily interest accrual at the matter level
- Allocate monthly interest payments across multiple matters
- Generate payoff reports for firm and client
- Match bank transactions to matter-specific expenses

### Current State (Reference)
- Excel-based workbook solution exists
- Manual data entry required
- Complex interest calculations and allocations done via macros
- Requires bank platform interaction for actual draws/payments

### Target State
- Web-based application with automated calculations
- Bank integration (future) for transaction feeds
- Real-time interest tracking
- User-friendly interface matching ATTY Financial brand
- Compliant reporting and audit trails

---

## 2. Brand Guidelines

### Visual Identity

**Primary Colors:**
- **Primary Blue:** `#1E3A5F` (Deep Navy)
- **Secondary Blue:** `#2D5B87` (Medium Blue)
- **Accent Teal:** `#4FD1C5` (Light Teal)
- **Success Green:** `#48BB78`
- **Warning Yellow:** `#F6AD55`
- **Error Red:** `#FC8181`

**Typography:**
- **Headings:** Inter Bold/600
- **Body:** Inter Regular/400
- **Numbers:** Inter Medium/500 (monospaced for financial data)

**UI Style:**
- Clean, professional financial dashboard aesthetic
- Card-based layouts
- Subtle shadows and borders
- Rounded corners (8px)
- Consistent spacing (8px grid)

---

## 3. Core Features & Requirements

### 3.1 System Access & Setup

#### FR-1: System Access
- Users access tool through banking platform (no separate credentials)
- Single Sign-On (SSO) integration
- One-time setup wizard for new firms

#### FR-2: Initial Setup
- Admin setup by ATTY Financial representative
- User completes setup wizard:
  - Firm name
  - Contact information
  - Firm logo upload
  - Prime rate configuration
  - Firm-specific modifier
- Settings editable after initial setup

#### FR-3: Compliance Certification
- One-time digital certification
- User certifies:
  - Funds for approved case expenses only
  - Entries are accurate
  - Case-specific principal repaid within 30 days of case closure
  - Digital signature required
- Permission for ATTY Financial to pull firm reports

### 3.2 Matter Management

#### FR-4: Client Matters
**Create New Matter:**
- Matter ID (unique, required)
- Full Client Name (required)
- Status: Active/Closed/Archive (default: Active)
- Notes (optional)

**Validation:**
- Error on duplicate Matter ID
- Cannot close Matter with outstanding principal balance
- Search/filter by Matter ID or client name

**Matter Details:**
- Total draws
- Total principal payments
- Total interest accrued
- Principal balance
- Total owed
- Links to generate firm payoff report
- Links to generate client payoff report

### 3.3 Transaction Management

#### FR-5: Draws on Line of Credit
**Transaction Entry:**
- Auto-populate from bank feed (live API connection)
- Type: "Draw"
- Allocate across one or multiple Matters
- Specify dollar amount per Matter
- Select expense category from approved list

**Expense Categories:**
- Court & Filing Fees
- Service of Process
- Depositions & Transcripts
- Expert Witness Fees
- Medical Records & Related Costs
- Investigation & Evidence
- Discovery & Document Production
- Witness Costs
- Travel & Trial Preparation
- Mediation & Arbitration
- Miscellaneous

**Validation:**
- No negative amounts
- Cannot assign to Closed/Archived matters
- Filter by case, type, category, date range

#### FR-6: Payments to Line of Credit
**Transaction Entry:**
- Auto-populate from bank feed
- Type: "Principal Payment"
- Allocate across one or multiple Matters
- Specify dollar amount per Matter
- Select payment category

**Payment Categories:**
- Principal Payment/Adjustment
- Payoff

**Validation:**
- No negative amounts
- Payment cannot exceed principal balance
- Cannot assign to Closed/Archived matters

#### FR-7: Interest Allocation
**Monthly Autodraft Processing:**
- Auto-populate from bank feed
- Type: "Interest Autodraft"
- Category: "Monthly Interest Draft"

**Allocation Logic (Waterfall):**
1. All prior transactions must be categorized and assigned
2. Interest allocation before processing newer transactions
3. **Tier 1:** Allocate to active matters with $0 principal balance (to clear interest owed)
4. **Tier 2:** Pro rata distribution across matters with principal balance > 0
5. Support carry-forward of unallocated amounts to next autodraft

**Edge Cases:**
- If autodraft > total interest owed: allocate all interest, hold remainder for next event
- All transactions before Interest Payment date must be categorized first
- Interest allocation required before categorizing same-day/later transactions

### 3.4 Interest Calculation Engine

#### FR-8: Interest Calculation
**Formula:**
- Daily interest = Principal Balance × (Prime Rate + Modifier) ÷ 360
- ACT/360 day count convention
- Day-after accrual (interest starts day after draw)
- Rate changes applied by effective date

**Recalculation Triggers:**
- Prime rate changes
- Principal payment applied
- Principal adjustment made
- User changes "as of" date

**Projection Feature:**
- Calculate total interest at future date
- Disclaimer: "Estimate only, does not account for potential rate changes"

**Technical Requirements:**
- Cents as integers (no floating-point drift)
- Clear rounding policy
- Audit trail for all calculations

### 3.5 Calculators

#### FR-9: Anticipated Draw Calculator
**Workflow:**
1. User selects multiple Matters from Active Matters list
2. User inputs expense amount for each selected Matter
3. System calculates total draw amount
4. User executes draw on banking platform
5. Transaction appears in dashboard
6. User matches transaction to pre-calculated amounts (QBO-style matching)

#### FR-10: Anticipated Payoff Calculator
**Workflow:**
1. User selects multiple Matters from Active Matters list
2. System calculates total firm payoff amount (principal only balances)
3. User executes principal-only payment on banking platform
4. Transaction appears in dashboard
5. User matches transaction to pre-calculated amounts

### 3.6 Reporting

#### FR-11: Firm Payoff Report
**Trigger:** Link next to Matter or dropdown selector

**Content:**
- Matter ID
- Date of Report
- Summary:
  - Total draws
  - Total interest accrued
  - Principal paid
  - Interest paid
  - Interest owed via next autodraft
  - Total firm payoff amount (= principal balance)
- Invoice-style listing of all transactions
- Print/Export to PDF option

**Note:** Generating Firm Payoff Report also generates Client Payoff Report

#### FR-12: Client Payoff Report
**Trigger:** Link next to Matter or dropdown selector

**Content:**
- Law firm details and logo
- Matter ID
- Date of Report
- Summary:
  - All draws
  - Total interest accrued
  - Total client payoff amount (= principal balance + interest)
- Invoice-style listing of all transactions
- Print/Export to PDF option

#### FR-13: Funding Report
**Trigger:** Dropdown selector for draw date

**Content:**
- Law firm info and logo
- Draw date
- Total draw amount
- Matter ID, Purpose, and individual amounts

#### FR-14: Finance Charge Report
**Trigger:** Dropdown selector for Interest Payment date

**Content:**
- Law firm info and logo
- Interest Payment date
- Total interest payment amount
- Matter ID, Principal Balance, individual interest payment amounts per Matter

### 3.7 Monitoring & Alerts

#### FR-15: Monitoring
**Alerts:**
- Warning highlighting closed cases with unpaid principal balances
- Days since case closure displayed
- Color-coded alerts:
  - **Yellow warning:** 20-29 days since case closed
  - **Red error:** 30+ days since case closed (payment overdue)

#### FR-16: Master Dashboard
**Portfolio Summary:**
- Total outstanding principal balance (must match banking platform)
- Total interest accrued across all cases
- Number of active cases
- Current effective interest rate

**Matter Search & Reports:**
- Search for specific Matters
- Generate case summary report:
  - Matter number
  - Client name
  - Case status
  - Total draws
  - Total interest
  - Total payments
  - Balance due
- Link to payoff reports

### 3.8 Banking Functions

#### FR-17: Banking Integration (Future)
- Draw on line of credit within system
- Repay line of credit within system
- Automatic data synchronization

---

## 4. Data Model

### Core Entities

```
Firm
├── id
├── name
├── contact_info
├── logo_url
├── prime_rate_modifier
├── line_of_credit_limit
├── created_at
└── settings

Matter
├── id (Matter ID)
├── client_name
├── status (Active/Closed/Archive)
├── notes
├── created_at
├── closed_at
└── derived fields:
    ├── total_draws
    ├── total_principal_payments
    ├── total_interest_accrued
    ├── principal_balance
    └── total_owed

Transaction
├── id
├── date
├── type (Draw/Principal Payment/Interest Autodraft)
├── category (from approved list)
├── amount
├── net_amount
├── status (Unassigned/Assigned/Allocated)
├── created_at
└── allocations:
    ├── matter_id
    └── allocated_amount

RateCalendar
├── effective_date
├── prime_rate
├── modifier
└── source/notes

DailyBalance (generated)
├── date
├── matter_id
├── principal_balance
├── interest_rate
├── daily_interest

InterestAllocation (generated)
├── autodraft_id
├── autodraft_date
├── matter_id
├── allocated_amount
├── interest_remaining_before
└── interest_remaining_after

AuditLog
├── id
├── timestamp
├── user_id
├── action
├── entity_type
├── entity_id
├── old_value
├── new_value
└── reason
```

---

## 5. User Interface Design

### 5.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header: ATTY Financial Logo | User Profile | Settings  │
├─────────────────────────────────────────────────────────┤
│ Sidebar Navigation                                      │
│  ├─ Dashboard                                          │
│  ├─ Matters                                             │
│  ├─ Transactions                                       │
│  ├─ Calculators                                        │
│  ├─ Reports                                            │
│  ├─ Interest Allocation                                │
│  └─ Settings                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Content Area                                      │
│  (Dynamic based on selected section)                    │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Page Specifications

#### Dashboard (Home)
- Portfolio summary cards (4 metrics)
- Quick action buttons
- Unassigned transactions table
- Alert banner for overdue matters
- Recent activity feed

#### Matters Page
- Search/filter bar
- "Add New Matter" button
- Matters table with columns:
  - Matter ID
  - Client Name
  - Status (badge)
  - Principal Balance
  - Interest Accrued
  - Total Owed
  - Actions (View/Edit/Close/Reports)

#### Matter Detail Page
- Matter information header
- Balance summary cards
- Transaction ledger
- Interest calculation breakdown
- Generate reports buttons

#### Transactions Page
- Filter bar (date range, matter, type, category)
- Unassigned transactions highlighted
- Transaction table with edit/allocation actions
- Bulk categorize feature

#### Calculators Page
- Tab: Draw Calculator
- Tab: Payoff Calculator
- Multi-select matter list
- Input fields per matter
- Total calculation display
- Save/Match functionality

#### Reports Page
- Report type selector
- Date/matter selectors
- Preview pane
- Print/Download buttons (PDF/CSV)

#### Interest Allocation Page
- Pending autodrafts list
- Allocation preview
- Execute allocation button
- Allocation history

#### Settings Page
- Firm profile (edit logo, contact info)
- Rate calendar management
- User management (admin only)
- Compliance certification status

### 5.3 Component Library

**Cards**
- Summary cards with icon, label, value, trend
- Matter detail cards
- Alert cards

**Tables**
- Sortable data tables
- Status badges
- Action buttons
- Bulk selection

**Forms**
- Input fields with validation
- Date pickers
- Select dropdowns
- Multi-select components
- File upload (logo)

**Buttons**
- Primary (CTA)
- Secondary
- Tertiary
- Icon buttons

**Modals**
- Add/Edit Matter
- Allocate Transaction
- Generate Report Preview
- Compliance Certification

**Feedback**
- Toast notifications
- Loading spinners
- Empty states
- Error banners

---

## 6. Technical Architecture

### 6.1 Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- React Query (data fetching)
- Zustand or Redux (state management)

**Backend (Future):**
- Node.js / Express
- PostgreSQL (database)
- JWT authentication
- Bank API integration

**Development:**
- ESLint + Prettier
- Vitest (testing)
- TypeScript for type safety

### 6.2 State Management

```
App State
├── user (authenticated user)
├── firm (firm settings and info)
├── matters (list of matters)
├── transactions (list of transactions)
├── rates (rate calendar)
├── allocations (interest allocations)
└── ui (current view, modals, filters)
```

### 6.3 API Structure (Future)

```
GET    /api/firm
GET    /api/matters
POST   /api/matters
PUT    /api/matters/:id
DELETE /api/matters/:id

GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
GET    /api/transactions/unassigned

POST   /api/allocations/calculate
POST   /api/allocations/execute

GET    /api/reports/firm-payoff
GET    /api/reports/client-payoff
GET    /api/reports/funding
GET    /api/reports/finance-charge

GET    /api/rates/calendar
POST   /api/rates/calendar

GET    /api/calculators/anticipated-draw
GET    /api/calculators/anticipated-payoff
```

---

## 7. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup with Vite + React + TypeScript
- [ ] Basic routing structure
- [ ] Layout components (header, sidebar)
- [ ] Mock data for demo
- [ ] Design system setup (colors, typography, components)

### Phase 2: Core Features (Week 3-4)
- [ ] Matter management (CRUD)
- [ ] Transaction logging (draws, payments)
- [ ] Basic interest calculation engine
- [ ] Dashboard with portfolio summary
- [ ] Validation and error handling

### Phase 3: Advanced Features (Week 5-6)
- [ ] Interest allocation logic (waterfall)
- [ ] Calculator tools (draw, payoff)
- [ ] Reporting generation (firm/client payoff)
- [ ] Rate calendar management
- [ ] Alert system for overdue matters

### Phase 4: Polish & Integration (Week 7-8)
- [ ] Bank transaction feed simulation
- [ ] Transaction matching (QBO-style)
- [ ] Advanced reporting (funding, finance charge)
- [ ] Compliance certification workflow
- [ ] Admin settings and user management

### Phase 5: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Deployment to production

---

## 8. Success Metrics

- **User Experience:** Complete matter-to-payoff workflow under 5 minutes
- **Accuracy:** Interest calculations match bank within $0.01
- **Efficiency:** 90% reduction in manual data entry vs Excel workbook
- **Reliability:** 99.9% uptime, no calculation errors
- **Adoption:** 80% of users complete onboarding without support

---

## 9. Security & Compliance

- SOC 2 aligned practices
- Encryption at rest and in transit
- Role-based access control (RBAC)
- Audit logging for all transactions
- Data retention policies
- GDPR/CCPA compliance (as applicable)

---

## 10. Future Enhancements

- [ ] Mobile app (iOS/Android)
- [ ] Bank API integration (live transaction feeds)
- [ ] Automated payment processing
- [ ] Advanced analytics and forecasting
- [ ] Multi-firm support
- [ ] White-label options for bank partners
- [ ] Integration with law firm case management systems

---

## Appendix: Reference Materials

- CCLOC_Functional_Requirements.csv (detailed FR list)
- new-customer-walkthrough.txt (Excel workbook demo transcript)
- Critical Items - Interest Tracker.docx.md (technical specs)
- ATTY Financial Brand Guideline.png (visual identity)
- Screenshot references (Excel tool UI)
- Existing Vercel app (for reference only, new build required)
