# Shivaay Library — Project Reference

Student management SPA for a physical library. Tracks enrollment, monthly payments, expenses, and documents. No backend server — all data via Firebase.

## Commands

```bash
npm run dev       # local dev server with HMR
npm run build     # production build → /dist
npm run preview   # preview production build
npm run lint      # ESLint
npm test          # utils self-check (assert-based, no framework)
```

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | React Router DOM v7 |
| UI | MUI v7 + MUI X (DataGrid, Charts, DatePickers) |
| Extra UI | Ant Design v5 (Upload component only) |
| Styling | MUI `sx` on Home/Expense/Payments; Tailwind v4 on Analytics/Reports |
| Export | xlsx, jsPDF + autotable, jszip + file-saver |
| Backend | Firebase v12 (Firestore + Auth) |
| File Storage | Cloudinary (unsigned upload) |
| Forms | React Hook Form v7 |
| Date Utils | Day.js |
| Deployment | Netlify (`netlify.toml` has SPA redirect) |

## Routes

| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | Public — redirects logged-in users to `/` |
| `/` | `Dashboard` (index) | Auth required |
| `/students` | `StudentDashboard` | Auth required |
| `/expenses` | `Expense` | Auth required |
| `/payments` | `PaymentPage` | Auth required |
| `/analytics` | `AnalyticsDashboard` | Auth required |
| `/reports` | `ReportDashboard` | Auth required |
| `/settings` | `SettingsPage` | Auth required |
| `*` | Redirect | `/` if logged in, `/login` if not |

## Authentication

- Google OAuth only (`signInWithPopup`)
- Hardcoded email allowlist in `src/context/Firebase.jsx` (`allowedEmails`)
- **This allowlist is client-side only.** It runs after `signInWithPopup` succeeds and only
  gates the UI. Actual access control must live in Firestore security rules — those rules are
  not in this repo.
  - `rohit.pal7171@gmail.com`
  - `shivaaylibrary98@gmail.com`
- To add a new admin: update `allowedEmails` array and redeploy
- No RBAC — all authenticated users have identical permissions

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |

## Global Conventions

- **No TypeScript** — plain JSX throughout
- **No Redux/Zustand** — React Context + local `useState`
- **No tests** — no test runner configured
- **Two styling systems**: MUI `sx` on the older pages, Tailwind utility classes on
  Analytics and Reports. Match whatever the file you are editing already uses.
- **No comments** unless the WHY is non-obvious
- Formatter: Prettier (2-space indent, single quotes, trailing commas `es5`)

## Key Rules

- Never import Firebase SDK methods directly in pages — always use `useFirebase()` from `src/context/Firebase.jsx`
- Always show feedback via `useSnackbar()` from `src/components/customComponents/CustomNotifications.jsx`
- Realtime Database was removed — it was never configured and had no callers
- `getLatestBilling(student)` in `src/utils/utils.js` is the single definition of "the latest
  monthly billing doc". Never take `subcollections.monthlyBilling[0]` directly
- **Deleting a payment only hides it.** The doc stays in Firestore with `deleted: true`.
  Three read functions strip these out — `getCollectionWithSubcollections`,
  `getSubcollectionDocumentsByStudentId` and `getLatestMonthlyBilling` — so reports, revenue
  and analytics skip them without doing anything themselves. Filter in JS, **not** with a
  Firestore `where`: old docs have no `deleted` field, so a `where` would hide them all.
  A student must always keep at least one payment.
- **Read every stored fee through `toAmount()`; never `Number()`.** The fee boxes are plain
  text, so a typed `"1,000"` used to reach Firestore as a string and `Number('1,000')` is
  `NaN` — one bad fee turned a whole revenue column, a P&L total or a receipt into `NaN`,
  and made the receipt print "Seat Reserved: No" for a seat that was paid for. `toAmount`
  strips commas and falls back to `0`. The three-fee sum lives once, in `paymentTotal()` —
  don't re-add `basicFee + seatFee + lockerFee` inline. Both forms also coerce fees with
  `toAmount` on save, so new records are always numbers.
- **Show money with `formatCurrency()`** (or `formatAmount()` where a ₹ icon is already on
  screen). Adding fees together can produce `165050.000000003`; these round it to 2 decimals.
- **Use `formatDate()` for dates, never `new Date()` directly.** Old records store dates as
  Firestore Timestamps, new ones as `'YYYY-MM-DD'` text. `formatDate` handles both and never
  returns an object (React crashes if you try to show one).
- **New fields:** `subscriptionFor` (`'Library'` or `'Co-working'`) on students and on each
  payment; `timings` on payments too. Old records don't have them, so always fall back to a
  default when reading.
- `dayjs` has **no plugins registered**. `dayjs(str, 'MMM YY')` silently misparses — use
  `monthLabelValue()` from `src/utils/utils.js` to sort `MMM YY` labels
- `getDocumentsByQuery` and `getOnlyCollectionData` are one implementation (`queryCollection`);
  the former adds `monthlyBillingLatest` at the cost of one extra read per document
- **Fee receipts** are generated per payment from the timeline in `PaymentDetail.jsx`.
  The printed text comes from `buildReceiptModel()` in `src/utils/utils.js`; `receiptPdf.js`
  only lays it out. Seat/Locker say Yes when **that payment** had a seat/locker fee — the
  student-level flags are deliberately ignored. `timings` is a duration, so it prints as
  `6 hours`, not a clock time. The amount prints as figures plus words
  (`Rs. 1,000  (One Thousand Rupees Only)`) via `amountInWords()`.
- **Receipt numbers live in `sequences/receipts`**, separate from `sequences/students`, so
  the next receipt number can be changed in Settings without touching student IDs. A number
  is spent on first print and stored as `receiptNo` on the billing doc, so reprints match.
  `getReceiptNumbering()` **throws** on a read failure — returning an error object would
  look like a fresh counter and let a Save reset live numbering to 1.
  After a first print, patch that one payment in local state — **never call**
  `fetchPaymentDetails()` there. It replaces the timeline with a spinner and remounts it,
  so the admin loses track of which receipt they just generated.
- **Two different "due" numbers — don't mix them up.**
  `billingDueAmount(bill)` is what is **still unpaid on that one payment**. It defaults to
  `0` (paid in full), which is also what every payment recorded before the field existed
  reads as. It appears on the fee receipt and in the payment timeline, and nowhere else.
  The dashboard due lists, the overdue report and the WhatsApp reminder answer a different
  question — **what the student owes at the next renewal** — and that stays
  `paymentTotal(bill)`. Putting `billingDueAmount` in those places would show ₹0 for
  everyone. Neither figure touches revenue, analytics, P&L or reports.
- **jsPDF has no ₹ glyph** (built-in fonts are WinAnsi). Anything drawn into a PDF must use
  `Rs.` — `formatCurrency()` is for the screen only.

## Subdirectory References

| Folder | CLAUDE.md covers |
|---|---|
| `src/context/` | Firebase context API — all methods, signatures, filter format |
| `src/database/` | Firestore collection schemas, Cloudinary upload, Human ID system |
| `src/utils/` | All exported utility functions and constants |
| `src/pages/HomePage/` | Student management: add/edit form, DataGrid, drawer, dashboard |
| `src/pages/PaymentDashboard/` | Payment page and payment recording flow |
| `src/pages/Expense/` | Expense management and form fields |
| `src/pages/AnalyticsDashboard/` | Analytics page: summary cards, occupancy, P&L, distributions + helpers |
| `src/pages/ReportDashboard/` | Report page: revenue, expense, P&L, overdue, student reports + export |
| `src/pages/Common/` | Shared layout: Navbar, Sidebar, upload dialog, mini student list |
| `src/pages/Settings/` | Receipt info tab: org details, T&C, receipt numbering |
| `src/components/customComponents/` | Reusable UI components and their props |
