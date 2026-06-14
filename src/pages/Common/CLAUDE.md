# Common / Shared Layout Components

Components shared across multiple pages.

## NavbarComponent

**Props:** `onDrawerOpen` — callback to open the sidebar drawer

- Renders the top AppBar with hamburger menu and admin avatar
- Fetches admin profile from `firebaseGetAdminData()` on mount
- Avatar click opens a hidden file input → uploads new profile photo to Cloudinary → saves URL to `admin` collection via `updateDocument`
- Admin profile image is stored in the `admin` Firestore collection (`profile_image` field)

---

## SidebarDrawer

Navigation drawer (collapsible). Contains nav links to all main routes:
- Dashboard (`/`)
- Students (`/students`)
- Expenses (`/expenses`)
- Payments (`/payments`)
- Analytics (`/analytics`)

Also contains the sign-out button that calls `firebaseSignOut()`.

**Props:** `open` (boolean), `setOpen` (function), `selectedPage` (string — the active
route key), `onNavigate` (function — called with a route key on item click).

**Theme:** dark-navy sidebar. All colors come from `sidebarColors` in `src/utils/utils.js`
— do not hardcode colors here. Active item = faint tint highlight + a bright `activeAccent`
left bar (only when expanded); collapsed shows the active icon in a tinted chip.

---

## MiniStudentList

Compact student list used on the Dashboard to show:
- Students with **overdue** payments
- Students with **upcoming dues** (within 7 days)

**Props:**

| Prop | Type | Description |
|---|---|---|
| `students` | array | Filtered array of student objects |
| `title` | string | Section header |
| `onPaymentClick` | function | Called with student object when "Pay" is clicked |
| `loading` | boolean | Shows skeleton while loading |

Each row shows student name, humanId, due date (color-coded via `getDueDateDisplay`), and a quick-pay button.

---

## UploadDocuments

Ant Design Upload dialog for attaching documents to a student.

- Uses `antd` `Upload` component (Dragger or button)
- Supports multiple file selection
- Does NOT upload to Cloudinary itself — returns selected `File` objects to the parent
- Parent (`StudentAddEdit`) handles the actual Cloudinary upload on form submit
- Max files enforced by parent (`MAX_FILES = 5`)

---

## GetDocumentIcon

Helper component that returns the appropriate MUI icon based on file MIME type or extension.

```jsx
<GetDocumentIcon type="application/pdf" />   // returns PictureAsPdf icon
<GetDocumentIcon type="image/jpeg" />         // returns Image icon
```

Used in `StudentDetail` when listing uploaded documents.
