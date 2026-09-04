# Utils Reference

All helpers and constants are in `utils.js`. Import only what you need.

---

## Default Form Values

### `defaultSchemaValues` — student form defaults
```js
{
  studentName: '', fatherName: '', dateOfBirth: '', dateOfJoining: '',
  gender: '', phoneNumber: '', phoneNumber2: '', referredBy: '',
  seatReserved: false, seatNumber: 0, locker: false, lockerNumber: 0,
  timings: '6', address: '', documents: [], studentProfile: '',
  aadhaarNumber: '', active: true,
  monthlyBilling: { subscriptionType: 'month', subscriptionDuration: 1,
    basicFee: 0, lockerFee: 0, seatFee: 0, paymentBy: '',
    nextPaymentDate: '', paymentDate: '' }
}
```

### `defaultMonthlyPaymentSchema` — billing sub-form defaults
```js
{ subscriptionType: 'month', subscriptionDuration: 1,
  basicFee: 0, lockerFee: 0, seatFee: 0,
  paymentBy: '', nextPaymentDate: '', paymentDate: '' }
```

### `defaultExpenseSchemaValues` — expense form defaults
```js
{ expenseType: 'Rent', miscellaneous: '', expensePaid: 0,
  expenseDate: '', expensePaymentMethod: '', remarks: '' }
```

### `expenseType` — expense type enum object
```js
{ Rent, Salary, Cleaner, 'Water bill', 'Electricity bill',
  'Internet bill', Stationery, Repairs, Miscellaneous }
```

---

## Styling Constants

```js
defaultBoxPadding                 // '20px'
defaultBorderColor                // '#d9d9d9'
labelSx                           // { fontSize: 13, fontWeight: 600, mb: 0.5 }
defaultDashboardBackgroundColor   // '#f0f4f8'
defaultBoxBorderRadius            // 4
```

### `sidebarColors` — sidebar/navbar theme palette

Single source of truth for the sidebar's dark-navy theme. `SidebarDrawer.jsx` reads
every color from here — do not hardcode colors in the component.

```js
{
  background: '#0d1b3d',                 // sidebar surface (matches the navbar navy)
  border: 'rgba(255,255,255,0.08)',      // right border + sign-out divider
  itemHoverBg: 'rgba(255,255,255,0.08)', // inactive item hover
  activeBg: 'rgba(255,255,255,0.08)',    // active item highlight (faint tint, no pill)
  activeHoverBg: 'rgba(255,255,255,0.12)',
  activeGlow: 'none',                    // box-shadow on active item
  activeContent: '#ffffff',              // active icon + label
  activeAccent: '#3b82f6',               // left indicator bar on the active item
  iconInactive: 'rgba(255,255,255,0.85)',
  labelInactive: '#ffffff',
  signOutIcon / signOutLabel / signOutHover / signOutHoverBg  // red sign-out tints
}
```

Active item = a faint tint highlight with a bright `activeAccent` bar on the left
(only when the drawer is expanded). The navbar navy in `NavbarComponent.jsx` is still
a local value (`rgba(13,27,61,0.92)`), not yet sourced from this palette.

---

## Date & Time Utilities

### `firebaseTimestampToDate(ts) → Date | null`
Converts Firestore Timestamp → JS Date. Handles: Timestamp object, JS Date passthrough, ISO string, number.

### `formatFirebaseTimestamp(ts, options?) → string`
Converts Firestore Timestamp → locale date string (e.g. `"Jun 13, 2025"`). Returns `'—'` if null.

### `formatDate(s) → string`
Formats an ISO string or Date → locale date string. Returns `'—'` if null/invalid.

### `dateToString(d) → string`
Converts JS Date → `"YYYY-MM-DD"` ISO string for Firestore storage. Timezone-safe.

### `formatMonthYear(dateStr) → string`
Returns `"Jun 2025"` format from a date string.

### `getDueDateDisplay(timestamp) → { text, color, fontWeight }`
Returns display config for a due date:
- Overdue / today → `color: 'error.main'`, bold
- Within 7 days → `color: 'warning.main'`, bold
- Otherwise → `color: 'text.primary'`, normal

### `computeNextPaymentDate(startDate, type, duration) → Date | null`
Calculates the next payment due date.
- `type`: `'month'` | `'year'`
- `duration`: number of months or years
- Preserves day-of-month; clamps to month end (e.g. Jan 31 + 1 month → Feb 28)

### `addMonthsPreserveDay(date, months) → Date`
### `addYearsPreserveDay(date, years) → Date`

---

## Financial Year Constants

```js
financialMonthOrder   // ['Apr','May',...,'Mar'] — Indian FY order
monthOrder            // ['Jan','Feb',...,'Dec']
fyStartYear           // e.g. 2024 (Apr of this year)
fyEndYear             // fyStartYear + 1
financialMonthsWithYear  // ['Apr 2024', ..., 'Mar 2025']
currentYear           // new Date().getFullYear()
currentMonth          // new Date().getMonth() (0-indexed)
```

---

## String / Display Helpers

### `safeValue(val) → string`
Returns `val` or `'--'` if falsy.

### `defaultCheckValue(v) → boolean`
Returns `true` if `v !== undefined && v !== null && v !== ''`.

### `showSubscriptionType(type) → string`
`'month'` → `'Monthly'`, `'year'` → `'Yearly'`.

### `formatFileSize(bytes) → string`
`0` → `'0 KB'`, `1536` → `'1.5 KB'`, etc.

---

## WhatsApp Helpers

### `buildWhatsAppLink(rawNumber, text?) → string`
Builds a WhatsApp URL (wa.me on mobile, web.whatsapp.com on desktop).
- `rawNumber`: any format, digits are stripped and used as E.164

### `sendMessageOnWhatsApp(NumberAsE164, textToBeSend)`
Opens WhatsApp in a new tab with the given number and pre-filled message.

---

## Billing / Month Helpers

### `getLatestBilling(student) → billingDoc | null`
The **single definition** of "the student's latest monthly billing doc". Picks the entry with
the newest `createdAt`, falling back to `paymentDate`. Returns `null` for a student with no
billing history.

Never take `student.subcollections.monthlyBilling[0]` directly — four call sites used to do
that with three different sort orders, two of which sorted on `paymentDate.seconds`, which is
`undefined` because payment dates are stored as `YYYY-MM-DD` strings.

### `monthLabelValue(label) → number`
Sortable value for a `'MMM YY'` display label. Returns `-Infinity` for anything unparseable.

```js
labels.sort((a, b) => monthLabelValue(a) - monthLabelValue(b))
```

**Do not use `dayjs(label, 'MMM YY')` for this.** No dayjs plugins are registered in this
project, so the format string is ignored and every label parses to year 2001.

### `formatCurrency(amount) → string`
`₹1,00,000` — Indian digit grouping. Re-exported by `analyticsHelpers` and `reportHelpers`.
