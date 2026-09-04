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
- `dayjs` has **no plugins registered**. `dayjs(str, 'MMM YY')` silently misparses — use
  `monthLabelValue()` from `src/utils/utils.js` to sort `MMM YY` labels
- `getDocumentsByQuery` and `getOnlyCollectionData` are one implementation (`queryCollection`);
  the former adds `monthlyBillingLatest` at the cost of one extra read per document

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
| `src/components/customComponents/` | Reusable UI components and their props |
