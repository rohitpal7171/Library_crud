# Payment Dashboard

Displays all student payments with date-range filtering. Read-only view — payments are recorded from the Student list or Dashboard, not from here.

## Files

| File | Purpose |
|---|---|
| `PaymentPage.jsx` | Container — fetches data, manages filter state, renders list |
| `PaymentList.jsx` | MUI DataGrid of flattened payment rows |
| `PaymentFilterAndAction.jsx` | Date range picker (start/end date) + CSV export |

---

## Data Flow

1. `PaymentPage` fetches via `getCollectionWithSubcollections({ collectionName: 'students', subcollections: ['monthlyBilling'] })`
2. Each student doc arrives with `subcollections.monthlyBilling` — an array of all their billing records
3. `PaymentPage` flattens these into rows: one row per billing doc, enriched with parent student fields
4. Client-side date filter applied against `paymentDate` on each billing doc

---

## Filter State

```js
clientFilters: {
  startPaymentDate: null,   // dayjs object or null
  endPaymentDate: null,     // dayjs object or null
}
```

Filter is applied client-side (no Firestore re-query) — entire dataset is loaded once.

---

## PaymentList Columns

Typical columns: student name, humanId, paymentDate, nextPaymentDate, subscriptionType, subscriptionDuration, basicFee, lockerFee, seatFee, total fee, paymentBy

---

## Adding a New Column

Add the field to `PaymentList.jsx` columns array. If the field comes from the student parent doc (not the billing subdoc), ensure `PaymentPage` includes it when building flattened rows.
