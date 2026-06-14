# Analytics Dashboard

Read-only analytics page at `/analytics`. Aggregates all students (with their
`monthlyBilling` subcollection) and all expenses into summary cards and charts.
Built with Tailwind CSS utility classes + MUI X Charts — **not** the MUI `sx`/Paper
pattern used elsewhere in the app.

## Data flow

`AnalyticsDashboard.jsx` fetches once on mount:
- `getCollectionWithSubcollections({ collectionName: 'students', subcollections: ['monthlyBilling'] })`
- `getOnlyCollectionData({ collectionName: 'expenses' })`

Derived data is memoized: `studentsWithBilling` (latest billing attached per student),
`activeStudents`, `allBillingDocs` (flattened), plus overdue / due-this-month / expected
revenue / this-month-expense calculations.

The root element carries the `analytics-page` class — see `src/index.css`, which scopes
`box-sizing: border-box` to this page only (Tailwind width utilities need it; the rest of
the app must not get it or MUI Paper heights break).

## Sections (render order)

| Component | Shows |
|---|---|
| `SummaryCards` | 5 cards: Overdue Payments, Seats Occupied, Lockers Occupied, Projected Revenue (gradient), This Month Expenses (gradient) |
| `PaymentAlerts` | Students with payments due in 8–30 days, as a responsive card grid. Always renders — shows an "all caught up" empty state when none |
| `OccupancyMap` | Seat + locker occupancy grids with % filled |
| `PLChart` | Revenue vs Expenses grouped bar chart, last 12 months, with total pills |
| `DistributionCharts` | 3 donut charts: Expense Categories, Payment Methods, Gender Distribution |

**Removed sections** (do not re-add without a reason): Referral Sources (the `referredBy`
field is in the schema but has no form input, so it was always empty), Subscription Type
donut, and Timing Slots bar chart.

## `analyticsHelpers.js`

| Function | Purpose |
|---|---|
| `tsToDate(ts)` | Firestore Timestamp / ISO / ms → `Date` |
| `getLastNMonths(n=12)` | Last N months as `'MMM YY'` labels, oldest first |
| `getRevenueByMonth(billingDocs)` | `{ 'Jun 25': total, ... }` summing basic+locker+seat by `paymentDate` month |
| `getExpensesByMonth(expenses)` | `{ 'Jun 25': total, ... }` by `expenseDate` month |
| `groupByCount(items, field)` | `[{label, value}]` count by field value, sorted desc |
| `groupExpensesByType(expenses)` | `[{label, value}]` expense totals by type (uses `miscellaneous` label when type is Miscellaneous) |
| `getLatestBillingPerStudent(students)` | Attaches `latestBilling` (newest `monthlyBilling` doc) to each student |
| `formatCurrency(amount)` | Indian-format currency string `₹1,00,000` |
| `getEnrollmentByMonth(students)` | All-time enrollment by `dateOfJoining` month, chronological |

## Conventions

- Empty data should still render the section header + an empty-state card (so the layout
  is predictable and users know where to look). `DistributionCharts` uses a per-card
  `empty` flag; `PaymentAlerts` renders its own empty state.
- MUI X Charts render axis labels as SVG `<text>` — `src/index.css` excludes SVG from the
  global font override so chart label widths/positions stay correct.
