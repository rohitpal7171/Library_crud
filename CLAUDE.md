# Shivaay Library — Project Reference

Student management SPA for a physical library. Tracks enrollment, monthly payments, expenses, and documents. No backend server — all data via Firebase.

## Commands

```bash
npm run dev       # local dev server with HMR
npm run build     # production build → /dist
npm run preview   # preview production build
npm run lint      # ESLint
```

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | React Router DOM v7 |
| UI | MUI v7 + MUI X (DataGrid, Charts, DatePickers) |
| Extra UI | Ant Design v5 (Upload component only) |
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
| `*` | Redirect | `/` if logged in, `/login` if not |

## Authentication

- Google OAuth only (`signInWithPopup`)
- Hardcoded email allowlist in `src/context/Firebase.jsx:42`
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
- **MUI `sx` prop** preferred over separate CSS files
- **No comments** unless the WHY is non-obvious
- Formatter: Prettier (2-space indent, single quotes, trailing commas `es5`)

## Key Rules

- Never import Firebase SDK methods directly in pages — always use `useFirebase()` from `src/context/Firebase.jsx`
- Always show feedback via `useSnackbar()` from `src/components/customComponents/CustomNotifications.jsx`
- Realtime Database is initialized but the URL is not configured — do not use it

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
| `src/pages/Common/` | Shared layout: Navbar, Sidebar, upload dialog, mini student list |
| `src/components/customComponents/` | Reusable UI components and their props |
