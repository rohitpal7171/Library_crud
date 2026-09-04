# Firebase Context API

All Firebase operations are in `Firebase.jsx`. Consume via `useFirebase()` — never import Firebase SDK directly in pages.

```jsx
import { useFirebase } from '../../context/Firebase';
const firebase = useFirebase();
```

---

## Auth State

| Key | Type | Description |
|---|---|---|
| `firebaseUser` | `User \| null` | Current Firebase user object |
| `firebaseAuthLoading` | `boolean` | True while auth resolves on mount — show spinner |
| `firebaseLoggedIn` | `boolean` | Shorthand `!!firebaseUser` |
| `firebaseAuthError` | `Error \| null` | Auth error if any |

---

## Auth Methods

### `firebaseSignInWithGoogle()`
```js
await firebase.firebaseSignInWithGoogle()
// Throws if email not in allowedEmails list
```
The allowlist check is **client-side only** — it runs after sign-in succeeds and gates the UI,
not the data. Firestore security rules are the real boundary.

### `firebaseSignOut()`
```js
const { success, error } = await firebase.firebaseSignOut()
```

### `firebaseGetAdminData()`
```js
const admin = await firebase.firebaseGetAdminData()
// Returns { id, profile_image, ...rest } | null
```

---

## Firestore Methods

### `createDataInFireStore(collectionName, data, additionalKeyName?)`
Creates a new document. Automatically:
- Generates a `humanId` (e.g. `SHY_0001`) via Firestore transaction
- Adds `createdAt` and `modifiedAt` server timestamps
- Creates `monthlyBilling` subcollection if `data.monthlyBilling` is present
- Enforces Aadhaar uniqueness (throws if duplicate found)

```js
const { data, error } = await firebase.createDataInFireStore('students', {
  studentName: 'John',
  aadhaarNumber: '1234...',
  monthlyBilling: { subscriptionType: 'month', basicFee: 500, ... }
})
// data.id = Firestore auto-generated doc ID
```

---

### `updateDocument(collectionName, docId, partialData)`
Updates fields on an existing document. Adds `modifiedAt`. Enforces Aadhaar uniqueness on update. Returns updated document.

```js
const { success, data, error } = await firebase.updateDocument('students', docId, { active: false })
```

---

### `deleteDocumentById(collectionName, docId, options)`
Batch-deletes subcollections first, then the parent doc. Logs `docId` to `willDeleteLaterInCloudinary/log.folders` for deferred Cloudinary cleanup.

```js
await firebase.deleteDocumentById('students', docId, { subcollections: ['monthlyBilling'] })
```

---

### `getDocumentById(collectionName, docId)`
```js
const { data, id, error } = await firebase.getDocumentById('students', docId)
```

---

### `getDocumentsByQuery({ collectionName, filters, orderField, orderDirection, pageSize, lastVisible })`
Fetches documents with optional filters + pagination. **Enriches each result with `monthlyBillingLatest`** (latest billing subcollection doc attached as `monthlyBillingLatest`).

```js
const { data, lastVisible } = await firebase.getDocumentsByQuery({
  collectionName: 'students',
  filters: ['active', '==', true],
  orderField: 'createdAt',
  orderDirection: 'desc',
  pageSize: 1000,
})
// data[n].monthlyBillingLatest is auto-attached
```

---

### `getOnlyCollectionData({ collectionName, filters, orderField, orderDirection, pageSize, lastVisible })`
Same implementation as `getDocumentsByQuery` (both call `queryCollection`) but **without**
subcollection enrichment. `getDocumentsByQuery` costs one extra read per document, so prefer
this one unless you actually need `monthlyBillingLatest`.

```js
const { data } = await firebase.getOnlyCollectionData({
  collectionName: 'expenses',
  filters: [['expenseType', '==', 'Rent']],
  orderField: 'expenseDate',
  orderDirection: 'desc',
})
```

---

### `getCollectionWithSubcollections({ collectionName, subcollections, orderField, orderDirection, subcollectionOrder })`
Fetches all parent docs plus all docs from each named subcollection. Attaches subcollection docs as `subcollections[name]`.

Also attaches `monthlyBillingLatest`, **derived from the already-fetched array** — no extra read.
Use `getLatestBilling(student)` from `src/utils/utils.js` rather than indexing the array yourself.

```js
const { data } = await firebase.getCollectionWithSubcollections({
  collectionName: 'students',
  subcollections: ['monthlyBilling'],
  orderField: 'createdAt',
  orderDirection: 'desc',
})
// data[n].subcollections.monthlyBilling = array of billing docs
```

---

### `getSubcollectionDocumentsByStudentId({ parentCollection, studentId, subcollectionName, orderField, orderDirection, pageSize, lastVisible })`
Paginated fetch of subcollection documents for a single student.

```js
const { docs, nextCursor, error } = await firebase.getSubcollectionDocumentsByStudentId({
  studentId: 'abc123',
  subcollectionName: 'monthlyBilling',
  orderField: 'createdAt',
  orderDirection: 'desc',
  pageSize: 100,
})
```

---

### `makeSubCollectionInFireStore(parentPath, subcollectionName, data)`
Adds a document to a subcollection. `parentPath` format: `"collectionName/docId"`.

```js
await firebase.makeSubCollectionInFireStore('students/abc123', 'monthlyBilling', {
  basicFee: 500,
  studentId: 'abc123',
})
```

---

### `editSubCollectionInFireStore(parentPath, subcollectionName, docId, data)`
Updates a specific subcollection document.

```js
await firebase.editSubCollectionInFireStore('students/abc123', 'monthlyBilling', billingDocId, {
  basicFee: 600,
})
```

---

## Filter Format

All query methods accept `filters` in any of these forms:

```js
// Single tuple
filters: ['active', '==', true]

// Multiple tuples
filters: [['active', '==', true], ['gender', '==', 'Male']]

// Object syntax
filters: { field: 'active', operator: '==', value: true }

// No filter (fetch all)
filters: null
```

Supported Firestore operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `array-contains`
