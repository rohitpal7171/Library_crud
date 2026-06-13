# Database & Storage Reference

## Firestore Collections

### `students`

```
students/{docId}
├── humanId          string      "SHY_0001" — auto-generated, never editable
├── studentName      string
├── fatherName       string
├── dateOfBirth      string      "YYYY-MM-DD"
├── dateOfJoining    string      "YYYY-MM-DD"
├── gender           string      "Male" | "Female"
├── phoneNumber      string
├── phoneNumber2     string
├── referredBy       string
├── seatReserved     boolean
├── seatNumber       number
├── locker           boolean
├── lockerNumber     number
├── timings          string      timing slot (e.g. "6")
├── address          string
├── documents        array       [{name, url, size, type, publicId, ...}]
├── studentProfile   string      Cloudinary URL for profile photo
├── aadhaarNumber    string      unique across the collection
├── active           boolean
├── createdAt        Timestamp   serverTimestamp()
└── modifiedAt       Timestamp   serverTimestamp()
```

**Subcollection: `students/{docId}/monthlyBilling`**

```
├── subscriptionType       string    "month" | "year"
├── subscriptionDuration   number    1, 3, 6, 12, etc.
├── basicFee               number
├── lockerFee              number
├── seatFee                number
├── paymentBy              string    payment method (Cash, UPI, etc.)
├── paymentDate            Timestamp when payment was made
├── nextPaymentDate        Timestamp computed due date
├── studentId              string    parent document ID (redundant reference)
├── createdAt              Timestamp
└── modifiedAt             Timestamp
```

When querying students via `getDocumentsByQuery`, the latest billing doc is auto-attached as `monthlyBillingLatest` on each student object.

---

### `expenses`

```
expenses/{docId}
├── humanId              string    auto-generated
├── expenseType          string    see enum below
├── miscellaneous        string    custom label when expenseType = "Miscellaneous"
├── expensePaid          number
├── expenseDate          string    "YYYY-MM-DD"
├── expensePaymentMethod string
├── remarks              string
├── createdAt            Timestamp
└── modifiedAt           Timestamp
```

**expenseType enum** (defined in `src/utils/utils.js`):
`Rent | Salary | Cleaner | Water bill | Electricity bill | Internet bill | Stationery | Repairs | Miscellaneous`

---

### `sequences`

Used for transactional human-readable ID generation. One document per collection that needs a `humanId`.

```
sequences/students
├── next       number    next integer to use (starts at 1)
├── width      number    zero-padding width (starts at 4, auto-increases)
├── prefix     string    "SHY_"
└── updatedAt  Timestamp
```

ID format: `{prefix}{next.toString().padStart(width, '0')}`
Example progression: `SHY_0001` → `SHY_0002` → `SHY_9999` → `SHY_10000`

The generation is a Firestore transaction inside `getNextHumanId()` in `Firebase.jsx` — safe under concurrent writes.

---

### `admin`

```
admin/{docId}
└── profile_image    string    Cloudinary URL for admin profile photo
```

Only one document expected. Fetched via `firebaseGetAdminData()`.

---

### `willDeleteLaterInCloudinary`

```
willDeleteLaterInCloudinary/log
└── folders    array    Firestore docIds of deleted students
```

When a student is deleted, their Firestore `docId` is appended to `folders` using `arrayUnion`. The corresponding Cloudinary folder (named after the docId) must be cleaned up separately. This is deferred — not immediate.

---

## Cloudinary File Storage

File: `src/database/fileStorage/cloudinary.js`

Student profile photos and documents are uploaded to Cloudinary using an **unsigned upload preset**.

- Each student's files are stored in a Cloudinary folder named after their Firestore `docId`
- Max **5 document files** per student (`MAX_FILES = 5` in `StudentAddEdit.jsx`)
- Upload uses `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` from `.env`

```js
import { uploadToCloudinary } from '../../database/fileStorage/cloudinary';

const result = await uploadToCloudinary(file, folderName)
// Returns Cloudinary response with { secure_url, public_id, ... }
```

Documents stored in the `documents` array on the student doc contain the Cloudinary URL and metadata needed for download/preview.

---

## Date Storage Convention

- Student and expense date fields (`dateOfBirth`, `dateOfJoining`, `expenseDate`) are stored as **ISO strings** `"YYYY-MM-DD"`
- Firebase `createdAt` / `modifiedAt` / `paymentDate` / `nextPaymentDate` are **Firestore Timestamps**
- Use `firebaseTimestampToDate(ts)` from `src/utils/utils.js` to convert Timestamps → JS Date
- Use `dateToString(date)` from utils to convert JS Date → `"YYYY-MM-DD"` for storage
