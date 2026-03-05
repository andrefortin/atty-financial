**Case Cost Line of Credit – Interest Tracking Tool**  
**Critical Features**

Core Purpose & Scope

* Illustrate the Portfolio / Firm View (the entire CCLOC facility)  
  * Total principal balance, availability, utilization, interest due, next draft date.  
* Matter-Level Subledger  
  * Every draw/credit belongs to a Matter ID.   
  * Portfolio totals \= sum of matters.  
* Deterministic Interest Engine  
  * ACT/360, day-after accrual, rate changes by effective date.  
* Interest-Only Monthly Autodraft Payments  
  * Bank autodrafts the interest payment  
  * Applied correctly across all matters with correct handling of carry-forward/unallocated amounts

Data Model 

* Firm / Borrower  
* Facility / Line of Credit  
  * Limit, index, rate modifier, day count convention, accrual rules, rounding rules  
* Rate Calendar  
  * Effective date, rate (Prime \+ margin with stored historical Prime), notes/source  
* Matters  
  * Matter ID (unique), status (active/closed/archive), optional data (client name, case type), principal balance, principal paid, interest accrued, interest paid, total owed  
* Transactions Ledger  
  * Transaction ID, Matter ID (nullable for firm-level entries if needed), date, type (from list), purpose (from list), amount, net amount  
* Daily Balances (generated)  
  * Per matter per day, principal, rate, daily interest, rollups  
* Interest Allocations (generated)  
  * Autodraft ID, Autodraft Date, Matter ID, allocated interest amounts  
  * Audit Log

Interest & Allocation Engine

* Interest Accrual  
  * ACT/360-day count  
  * Day-after accrual convention  
  * Rate changes applied by effective date (rate calendar drives daily rate).  
  * Engine must operate in “cents as integers” internally (no drift of interest across matters), with clear rounding policy at the final presentation to match totals.  
* Bank Autodraft of Interest Due  
  * Ability to compute “interest accrued as-of date” and “interest due on a scheduled draft date”  
  * Must support partial period calculations (e.g., as-of today, mid-cycle)  
* Allocation Logic  
  * Allocate a firm-level interest autodraft payment across matters  
    * Compute Interest Remaining per matter as-of draft date  
    * Waterfall tiers:  
      * Tier 1: matters with Principal Balance \= 0 (to clear interest owed first)  
      * Tier 2: remaining matters pro-rata by principal, capped at Interest Remaining.  
  * Must support “carry-forward”:  
    * If autodraft amount differs from computed due, store the unallocated remainder and apply it to the next autodraft  
  * Validation: allocations must sum to draft amount (minus any retained carry-forward) and never exceed each matter’s Interest Remaining.

User Workflows 

* Add/Edit Matter (with guardrails, cannot delete if ledger exists, “close/archive” instead).  
* Post Transactions  
  * Draws, principal payments, interest autodraft payments, principal adjustments.  
  * Bulk import with mapping \+ validation \+ preview  
* Run Autodraft  
  * Generate a draft event (date & amount), produce allocations, lock it  
  * Re-run logic safely only via explicit “void and reissue” workflow  
* As-of Reporting  
  * Pick an as-of date and recompute consistently

Reporting Outputs 

* Matter Principal Balance report (print/copy/paste friendly)  
* Firm Payoff / Client Payoff reports  
  * Single matter payoff \+ multi-matter payoff  
* Interest Summary  
  * Interest accrued YTD/MTD, interest due next draft, interest allocated by matter for a period  
* Transaction Register  
  * Filters \- matter, date range, type, purpose \- export to CSV/PDF  
* Reconciliation View  
  * Bank drafted $X vs system computed $Y” variance explanation (rate changes, timing, carry-forward)

Controls, Security, & Compliance 

* Role-Based Access  
* Admin (ATTY Financial) configures facility/rates. User (law firm) posts transactions   
* Data Controls  
  * After a draft is finalized, lock underlying ledger entries and allocations unless voided  
* Audit Trail  
  *  Every change (who/what/when/why)  
* Sensitive Data Handling  
  * Encryption at rest \+ in transit  
  * SOC2-aligned practices-logging, access reviews, change management

System Architecture Requirements

* Single source of truth ledger  
* Clear separation:  
  * Ledger (inputs)  
  * Engine (derived daily balances \+ allocations)  
  * Reports (read models / cached views)  
* Daily recalculations

UI Requirements

* Dashboard (limit, outstanding principal, interest rate, payment due date, unassigned/uncategorized transactions)  
* Matter List (add new, close/archive, searchable, sortable, includes principal and accrued interest)  
* Matter Detail (ledger, balances, payoff)  
* Draft Calculator (multi-select matters, input expenses per matter, total field displays how much to draft)  
  * Ideal to have something similar to QBO transaction matching once transaction posts and displays in dashboard  
* Payoff Calculator (multi-select matters, total field displays multi-matter payoff amount  
  * Ideal to have something similar to QBO transaction matching once payoff posts and displays in dashboard  
* Admin screen with rate calendar maintenance with effective dates and validation, new user access, etc.

Other

* Desired to have a DEMO environment with dummy data  
* Overall goal is to limit as much manual data entry as possible