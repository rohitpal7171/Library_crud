# HomePage — Student Management

This folder contains the main student management UI, dashboard analytics, and payment recording.

## Files

| File | Purpose |
|---|---|
| `HomePage.jsx` | Layout shell — renders Navbar + Sidebar + `<Outlet>` |
| `Dashboard.jsx` | Analytics page: revenue charts, expense trends, student stats, due lists |
| `StudentDashboard.jsx` | Tab controller (Active / Inactive / All students) — renders `StudentList` |
| `StudentList.jsx` | MUI DataGrid for students with inline edit/delete/payment actions |
| `StudentAddEdit.jsx` | Add / Edit student dialog (React Hook Form) |
| `StudentDetail.jsx` | Right-side drawer: full student profile, documents, billing history |
| `PaymentDetail.jsx` | Modal for recording a new payment against a student |
| `FilterAndActions.jsx` | Toolbar: active/inactive filter toggle + CSV export |

---

## StudentAddEdit

**Props:**

| Prop | Type | Description |
|---|---|---|
| `open` | boolean | Controls dialog visibility |
| `onClose` | function | Called on close — always resets form |
| `editData` | object | Pre-fill values when `type='EDIT'` |
| `type` | `'ADD'` \| `'EDIT'` | Determines create vs update flow |
| `fetchStudentData` | function | Refresh parent list after save |
| `serverFilters` | any | Passed through to re-fetch with same filters |

**Form fields** (all from `defaultSchemaValues` in `utils.js`):
- Personal: `studentName`, `fatherName`, `dateOfBirth`, `gender`, `aadhaarNumber`
- Contact: `phoneNumber`, `phoneNumber2`, `referredBy`, `address`
- Enrollment: `dateOfJoining`, `timings`, `active`, `studentProfile`
- Seat: `seatReserved` (boolean) → shows `seatNumber` when true
- Locker: `locker` (boolean) → shows `lockerNumber` when true
- Billing: nested under `monthlyBilling.*` — `subscriptionType`, `subscriptionDuration`, `basicFee`, `lockerFee`, `seatFee`, `paymentBy`, `paymentDate`
- Documents: up to 5 files (`MAX_FILES = 5`), stored in Cloudinary

**Next payment date** is computed live using `computeNextPaymentDate(dateOfJoining, subscriptionType, subscriptionDuration)` and displayed as a preview — not stored by the user, auto-saved.

**On submit (ADD):** calls `createDataInFireStore('students', data)`
**On submit (EDIT):** calls `updateDocument('students', docId, data)` + `editSubCollectionInFireStore` for billing

---

## StudentList

**Props received from StudentDashboard:**

| Prop | Purpose |
|---|---|
| `students` | Array of student objects (with `monthlyBillingLatest` attached) |
| `loading` | boolean for DataGrid loading state |
| `fetchStudentData` | Refresh callback |
| `serverFilters` | Current active filters (passed to add/edit) |
| `selectedStudentForEdit` | Lifted state for selected row |
| `studentRowSelectionModel` | DataGrid row selection |

**DataGrid columns:** humanId, studentName (with avatar + gender icon), fatherName, timings, dateOfJoining, nextPaymentDate (with color-coded due display), active (switch), actions (edit/delete/payment menu)

**Column visibility defaults:** `fatherName` hidden on load.

**Actions per row:**
- Edit → opens `StudentAddEdit` in EDIT mode
- Delete → calls `deleteDocumentById` with `subcollections: ['monthlyBilling']`
- Record Payment → opens `PaymentDetail`
- Click row → opens `StudentDetail` drawer

---

## PaymentDetail

**Props:**

| Prop | Type | Description |
|---|---|---|
| `open` | boolean | |
| `onClose` | function | |
| `selectedStudent` | object | Full student object with `monthlyBillingLatest` |
| `fetchStudentData` | function | Refresh after payment recorded |

Records a new payment by calling `makeSubCollectionInFireStore('students/{id}', 'monthlyBilling', billingData)`. Computes `nextPaymentDate` from `paymentDate + subscriptionType + subscriptionDuration`.

---

## Dashboard Analytics

Data sourced by fetching all students (with `monthlyBillingLatest`) and all expenses.

**Stat cards shown:**
- Total active students
- New students this month
- Seats reserved / Lockers active
- Total revenue this FY
- Total expenses this FY
- Net savings this FY

**Charts:**
- Revenue trend: last 12 months (from `paymentDate` on billing docs)
- Expense trend: last 12 months (from `expenseDate`)
- Combined on same LineChart for comparison

**Due lists (MiniStudentList):**
- Students with overdue payments
- Students with upcoming dues (within 7 days)

---

## FilterAndActions

Renders above `StudentList`. Provides:
- Active/Inactive/All tab filter (updates `serverFilters`)
- CSV export: downloads all visible student rows as `.csv`
  - Excludes payment columns (payment data lives in subcollection)
  - Uses browser `Blob` + `URL.createObjectURL`
