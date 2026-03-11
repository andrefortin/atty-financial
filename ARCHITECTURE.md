# ATTY Financial - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Dashboard│  │  Matters  │  │Transactions│ │ Calculators│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Reports │  │Allocation│  │ Settings │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Matter    │  │Transaction│ │   Firm    │ │   UI     │ │
│  │  Store   │  │  Store   │ │  Store   │ │  Store   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │ Interest Calculator  │  │ Allocation Service    │      │
│  │ - Daily accrual      │  │ - Waterfall logic     │      │
│  │ - Rate changes       │  │ - Pro rata            │      │
│  │ - Balance updates    │  │ - Carry-forward       │      │
│  └──────────────────────┘  └──────────────────────┘      │
│  ┌──────────────────────┐  ┌──────────────────────┐      │
│  │ Report Generator     │  │ Validation Service    │      │
│  │ - Firm payoff        │  │ - Form validation     │      │
│  │ - Client payoff      │  │ - Business rules      │      │
│  │ - Funding reports    │  │ - Error handling      │      │
│  └──────────────────────┘  └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Matters │  │Trans-   │ │  Firm   │ │  Rates  │      │
│  │         │  │actions  │ │         │ │         │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │Alloc-   │  │ Audit   │ │ Daily   │                   │
│  │ations  │  │  Log    │ │Balances │                   │
│  └─────────┘  └─────────┘  └─────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Banking Platform │  │ Federal Reserve  │                │
│  │ (Future)         │  │ (Prime Rate)     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### 1. Draw Transaction Flow

```
User executes draw on banking platform
              │
              ▼
Bank transaction appears in feed
              │
              ▼
Transaction marked as "Unassigned"
              │
              ▼
User selects transaction
              │
              ▼
User allocates to matter(s)
              │
              ▼
[Validation: Matter not closed, amounts match]
              │
              ▼
Transaction status → "Assigned"
              │
              ▼
Interest calculator updates matter balance
              │
              ▼
Dashboard metrics updated
              │
              ▼
Principal balance increases
```

### 2. Interest Allocation Flow

```
Monthly interest autodraft received
              │
              ▼
System calculates interest owed per matter
              │
              ▼
[Waterfall Allocation]
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
Tier 1:          Tier 2:
$0 Principal    Pro Rata
Balance         Distribution
    │                   │
    └─────────┬─────────┘
              │
              ▼
[Check: Amount ≤ Total Interest Owed]
              │
    ┌─────────┴─────────┐
    │                   │
Yes                  No
    │                   │
    ▼                   ▼
Allocate all      Allocate total
interest           hold remainder
    │                   │
    └─────────┬─────────┘
              │
              ▼
Create allocation records
              │
              ▼
Update matter interest balances
              │
              ▼
Generate finance charge report
```

### 3. Payoff Flow

```
User selects matter(s) for payoff
              │
              ▼
Calculate payoff amount
              │
    ┌─────────┴─────────┐
    │                   │
Firm Payoff         Client Payoff
(Principal only)     (Principal + Interest)
    │                   │
    ▼                   ▼
Generate report       Generate report
    │                   │
    └─────────┬─────────┘
              │
              ▼
User executes principal payment
              │
              ▼
Payment transaction recorded
              │
              ▼
Matter principal balance → $0
              │
              ▼
Interest accrual stops
              │
              ▼
Matter can be closed
```

## 📊 Entity Relationships

```
┌─────────────────┐
│      Firm       │
│  ───────────── │
│  id             │
│  name           │
│  primeModifier  │◄──────────┐
│  creditLimit    │           │
└────────┬────────┘           │
         │                    │
         │ has many           │
         ▼                    │
┌─────────────────┐           │
│     Matter      │           │
│  ───────────── │           │
│  id (unique)    │           │
│  clientName     │           │
│  status         │           │
│  principalBal   │───────────┘
│  interestBal    │
└────────┬────────┘
         │
         │ has many
         ▼
┌─────────────────┐
│  Transaction    │
│  ───────────── │
│  id             │
│  date           │
│  type           │
│  category       │
│  amount         │
│  status         │
└────────┬────────┘
         │
         │ many-to-many
         │
┌─────────────────┐
│   Allocation    │
│  ───────────── │
│  matterId       │
│  transactionId  │
│  amount         │
└─────────────────┘

┌─────────────────┐
│   RateEntry     │
│  ───────────── │
│  effectiveDate  │
│  primeRate      │◄────────────┐
│  modifier       │              │
│  totalRate      │              │
└─────────────────┘              │
                                 │
┌─────────────────┐              │
│ DailyBalance    │              │
│  ───────────── │              │
│  date           │              │
│  matterId       │              │
│  principal      │──────────────┘
│  interestRate   │
│  dailyInterest  │
└─────────────────┘
```

## 🧮 Interest Calculation Engine

### Daily Interest Formula

```
Daily Interest = Principal Balance × (Prime Rate + Modifier) ÷ 360
```

### Example Calculation

**Scenario:**
- Principal Balance: $50,000
- Prime Rate: 8.5%
- Firm Modifier: +2.5%
- Total Rate: 11.0%

**Calculation:**
```
Daily Interest = $50,000 × 0.11 ÷ 360
               = $5,500 ÷ 360
               = $15.28 per day
```

**30-Day Interest:**
```
$15.28 × 30 = $458.40
```

### Rate Change Handling

When rates change, interest is calculated per rate period:

```
Period 1 (Jan 1-15): Rate = 11.0%
Period 2 (Jan 16-31): Rate = 11.25%

Interest = (Balance × 0.11 ÷ 360 × 15) + (Balance × 0.1125 ÷ 360 × 15)
```

## 🌊 Waterfall Allocation Logic

### Tier 1: Matters with $0 Principal Balance

```
For each matter with principalBalance = 0:
  Allocate = min(InterestRemaining, AllocationAmount)
  InterestRemaining -= Allocate
  AllocationAmount -= Allocate
```

**Purpose:** Clear interest owed first

### Tier 2: Matters with Principal Balance > 0

```
For each matter with principalBalance > 0:
  ProRataShare = (PrincipalBalance ÷ TotalPrincipal) × AllocationAmount
  Allocate = min(ProRataShare, InterestRemaining)
```

**Purpose:** Fair distribution across all matters

### Carry-Forward

```
If AllocationAmount > TotalInterestOwed:
  Allocate = TotalInterestOwed
  CarryForward = AllocationAmount - TotalInterestOwed

Next Allocation:
  Apply CarryForward first, then Tier 1, then Tier 2
```

## 📈 Dashboard Metrics Calculation

### Total Principal Balance
```
SUM(matter.principalBalance for all matters)
```

### Total Interest Accrued
```
SUM(matter.interestAccrued - matter.interestPaid for all matters)
```

### Active Matters Count
```
COUNT(matter WHERE matter.status = 'Active')
```

### Current Effective Rate
```
Most recent RateEntry.totalRate
```

### Utilization Percentage
```
(Total Principal Balance ÷ Firm Credit Limit) × 100
```

## 🔐 Security & Compliance

### Audit Trail
```
Every change logged:
  - Who (user)
  - What (action)
  - When (timestamp)
  - Why (reason)
```

### Data Controls
```
Before allocation execution:
  ✓ All transactions categorized
  ✓ Valid matter statuses
  ✓ Amounts balance

After allocation execution:
  ✓ Ledger entries locked
  ✓ Allocations immutable
  ✓ Records archived
```

### Role-Based Access
```
Admin: Can configure rates, manage users
User: Can add/edit transactions
Viewer: Read-only access
```

## 🚀 Performance Considerations

### Optimization Strategies

1. **Memoization**
   - Cache calculated balances
   - Recalculate only on data change

2. **Lazy Loading**
   - Load transactions on demand
   - Paginate large lists

3. **Batch Processing**
   - Process allocations in batches
   - Bulk database operations

4. **Debouncing**
   - Debounce search inputs
   - Throttle calculations

### Data Caching
```
Dashboard metrics: Cache for 5 minutes
Matter balances: Cache until transaction change
Interest calculations: Cache until rate change
```

## 🧪 Testing Strategy

### Unit Tests
- Interest calculation formulas
- Allocation logic
- Validation rules
- Formatter functions

### Integration Tests
- Transaction flow
- Allocation workflow
- Report generation
- User authentication

### E2E Tests
- Complete matter lifecycle
- Full allocation process
- Report generation and export
- User settings changes

---

**Architecture Version:** 1.0
**Last Updated:** March 2024
