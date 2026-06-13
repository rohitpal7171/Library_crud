# Expense Management

Tracks operating expenses for the library (rent, salary, bills, etc.).

## Files

| File | Purpose |
|---|---|
| `Expense.jsx` | Container — fetches data, manages state |
| `ExpenseList.jsx` | MUI DataGrid of expenses |
| `ExpenseAddEdit.jsx` | Add / Edit expense dialog (React Hook Form) |
| `ExpenseFilterAndActions.jsx` | Filter controls + CSV export |

---

## ExpenseAddEdit

**Props:**

| Prop | Type | Description |
|---|---|---|
| `open` | boolean | Controls dialog visibility |
| `onClose` | function | Called on close |
| `editData` | object | Pre-fill values when `type='EDIT'` |
| `type` | `'ADD'` \| `'EDIT'` | Create vs update |
| `fetchData` | function | Refresh list after save |

**Form fields** (from `defaultExpenseSchemaValues` in `utils.js`):

| Field | Type | Notes |
|---|---|---|
| `expenseType` | select | From `expenseType` enum in utils.js |
| `miscellaneous` | text | Only shown when `expenseType === 'Miscellaneous'` |
| `expensePaid` | number | Amount in ₹ |
| `expenseDate` | date | Stored as `"YYYY-MM-DD"` |
| `expensePaymentMethod` | text | Cash, UPI, etc. |
| `remarks` | text | Optional notes |

**On submit (ADD):** calls `createDataInFireStore('expenses', data)`
**On submit (EDIT):** calls `updateDocument('expenses', docId, data)`

**Miscellaneous logic:** When `expenseType` changes away from `'Miscellaneous'`, the `miscellaneous` field is auto-cleared via `useWatch` + `setValue`.

---

## expenseType Enum

```js
Rent | Salary | Cleaner | Water bill | Electricity bill | Internet bill | Stationery | Repairs | Miscellaneous
```

Defined in `src/utils/utils.js` as `expenseType` object. Use `Object.keys(expenseType)` to render the dropdown.

---

## Expense Data in Dashboard

The Dashboard fetches expenses separately (via `getOnlyCollectionData('expenses')`) and uses `expenseDate` to aggregate monthly totals for the expense trend chart.
