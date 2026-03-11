# ATTY Financial - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to `http://localhost:5173`

---

## 📖 What You'll See

### Dashboard Overview
The dashboard provides a complete view of your case cost line of credit portfolio.

#### Key Metrics (Top Row)
- **Total Principal Balance:** Shows current outstanding balance
- **Total Interest Accrued:** Total interest across all matters
- **Active Matters:** Number of currently active cases
- **Current Rate:** Prime rate + firm modifier

#### Alerts Banner
- **Yellow Warning:** Matter closed 20-29 days ago with balance
- **Red Error:** Matter closed 30+ days ago with balance (overdue!)

#### Unassigned Transactions
- Shows transactions from bank feed that need categorization
- Click to allocate to specific matters

#### Quick Actions
- **New Matter:** Add a new client matter
- **Draw Calculator:** Calculate anticipated draws
- **Generate Report:** Create payoff reports

#### Next Interest Payment
- Shows when next autodraft will occur
- Displays estimated amount
- Ensures sufficient funds available

---

## 🎨 Navigation

### Sidebar Menu
- **Dashboard** - Portfolio overview and alerts
- **Matters** - View and manage all client matters
- **Transactions** - Log and categorize transactions
- **Calculators** - Calculate draws and payoffs
- **Reports** - Generate payoff and funding reports
- **Interest Allocation** - Allocate monthly interest payments
- **Settings** - Firm profile, rates, and compliance

### Sidebar Controls
- Click the arrow icon to collapse/expand sidebar
- Current page is highlighted in accent color
- Hover effects show active selection

---

## 💰 Understanding the Numbers

### Principal Balance
The amount drawn from your line of credit that hasn't been repaid.

**Formula:** Total Draws - Total Principal Payments = Principal Balance

### Interest Accrued
Daily interest calculated on principal balance.

**Formula:** Principal Balance × (Prime Rate + Modifier) ÷ 360

**Example:** $10,000 × 11.0% ÷ 360 = $3.06 per day

### Total Owed
What the client owes the firm (principal + interest).

**Formula:** Principal Balance + Interest Accrued - Interest Paid

---

## 📋 Key Workflows

### 1. Add a New Matter
1. Navigate to Matters page
2. Click "Add New Matter"
3. Enter Matter ID (unique identifier)
4. Enter Client Name
5. Add optional notes
6. Click Save

### 2. Record a Draw
1. Navigate to Transactions page
2. Click "Add Transaction"
3. Select type: "Draw"
4. Enter amount from bank statement
5. Select expense category
6. Allocate to one or more matters
7. Click Save

### 3. Allocate Monthly Interest
1. Navigate to Interest Allocation page
2. Select pending autodraft
3. Preview allocation (waterfall shown)
4. Verify amounts
5. Click "Execute Allocation"

### 4. Generate Payoff Report
1. Navigate to Reports page
2. Select "Firm Payoff" or "Client Payoff"
3. Choose matter from dropdown
4. Click "Generate Report"
5. Preview and download PDF

---

## 🚨 Understanding Alerts

### Overdue Matters
When a matter is closed but still has a principal balance:

**Days 1-19:** No alert (grace period)
**Days 20-29:** ⚠️ Yellow Warning
**Days 30+:** 🔴 Red Error (payment overdue!)

**Action Required:**
1. Click on the alert
2. View matter details
3. Make principal payment
4. Clear the balance

### Unassigned Transactions
Transactions from bank feed that haven't been categorized:

**Why Important:**
- Interest calculations need categorization
- Cannot close matters with unassigned transactions
- Affects allocation accuracy

**Action Required:**
1. Click on transaction
2. Select matter(s) to allocate
3. Specify amounts
4. Save allocation

---

## 🧮 Using Calculators

### Draw Calculator
Use before making a bank draw:

1. Navigate to Calculators
2. Select "Draw Calculator"
3. Check boxes next to matters needing funds
4. Enter expense amount for each
5. View total draw amount
6. Execute draw on banking platform
7. Transaction appears, click "Match"

**Benefit:** Pre-allocates expenses for quick matching

### Payoff Calculator
Use before making principal payment:

1. Navigate to Calculators
2. Select "Payoff Calculator"
3. Check boxes next to matters to payoff
4. View total payoff amount
5. Execute principal-only payment
6. Transaction appears, click "Match"

**Benefit:** Stops interest accrual immediately

---

## 📊 Reports Explained

### Firm Payoff Report
What your firm owes ATTY Financial.

**Includes:**
- Principal balance only
- Total draws
- Interest accrued (for reference)
- Principal paid
- Transaction ledger

**Use:** To make principal-only payment

### Client Payoff Report
What your client owes your firm.

**Includes:**
- Principal balance + interest accrued
- Total draws
- All transactions
- Invoice-style format
- Firm logo and details

**Use:** To bill your client

### Funding Report
Shows where money was allocated on a specific draw date.

**Includes:**
- Total draw amount
- Each matter and purpose
- Individual amounts

**Use:** Audit trail and documentation

### Finance Charge Report
Shows how interest payment was allocated.

**Includes:**
- Total interest payment
- Each matter's allocation
- Principal balance per matter

**Use:** Verify interest allocation

---

## ⚙️ Settings Overview

### Firm Profile
- Update firm name
- Contact information
- Logo upload
- Address

### Rate Calendar
- View rate change history
- Add new rate changes
- Effective date tracking
- Prime rate + modifier

### Compliance Certification
- One-time digital certification
- Certifies proper use of funds
- Digital signature required
- Authorizes ATTY Financial to pull reports

### User Management (Admin Only)
- Add/remove users
- Assign roles (Admin/User/Viewer)
- Manage access

---

## 🔐 Security Features

### Data Protection
- All transactions logged
- Audit trail maintained
- Cannot delete matters with transactions
- Read-only after allocation

### Role-Based Access
- **Admin:** Full access, can configure rates
- **User:** Can add/edit transactions
- **Viewer:** Read-only access

---

## 💡 Pro Tips

### 1. Daily Review
- Check unassigned transactions daily
- Review alerts for overdue matters
- Monitor principal balance vs credit limit

### 2. Interest Allocation
- Allocate monthly interest promptly
- Verify allocation amounts
- Check for carry-forward amounts

### 3. Transaction Matching
- Use calculators before bank actions
- Match transactions immediately
- Keep allocation organized

### 4. Report Generation
- Generate reports before closing matters
- Keep payoff reports for clients
- Archive funding reports annually

### 5. Rate Changes
- Monitor prime rate changes
- Update rate calendar promptly
- Verify interest recalculation

---

## 🆘 Troubleshooting

### Transaction Won't Allocate
- Check if matter is Closed/Archived
- Verify amounts balance
- Ensure all prior transactions are assigned

### Interest Doesn't Match
- Check rate calendar for changes
- Verify day count convention (ACT/360)
- Review allocation history

### Can't Close Matter
- Must have $0 principal balance
- All transactions must be assigned
- Interest must be allocated

### Can't Allocate Interest
- All prior transactions must be categorized
- No unassigned transactions before autodraft date
- Verify autodraft amount

---

## 📞 Support

For detailed requirements, see:
- [Design Document](./DESIGN_DOCUMENT.md)
- [Functional Requirements](./docs/CCLOC_Functional_Requirements.xlsx - Requirements.csv)
- [Critical Features](./docs/Critical%20Items%20-%20Interest%20Tracker.docx.md)

---

## 🎉 Key Takeaways

1. **Track everything:** Log all draws, payments, and interest
2. **Allocate promptly:** Don't let unassigned transactions accumulate
3. **Monitor alerts:** Address overdue matters immediately
4. **Use calculators:** Pre-calculate before bank actions
5. **Generate reports:** Keep documentation for clients and audits

---

**ATTY Financial** - Making case cost tracking simple and accurate! 💼💰
