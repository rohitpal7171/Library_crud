# Settings

Single page at `/settings`, MUI `sx` styling. One tab today: **Receipt Info**.

## Files

| File | Purpose |
|---|---|
| `SettingsPage.jsx` | Tabs shell + the Receipt Info form |

## What it edits

Two documents, saved together by the one Save button:

```
admin/{docId}.receipt      { address, email, phones, terms }
sequences/receipts         { next, prefix }
```

- `admin` is the same single doc the navbar reads for `profile_image`. There is no
  separate settings collection — `firebaseGetAdminData()` already fetches it, and the
  logo on the receipt is that same `profile_image`.
- `terms` is one bullet per line in a plain textarea. `receiptTermsList()` in
  `src/utils/utils.js` splits it, strips any bullet characters and drops blank lines.
- `nextReceiptNumber` writes `sequences/receipts.next` via `updateReceiptNumbering()`,
  which is hardwired to the receipts document — it cannot touch `sequences/students`.
  Setting it **below** the current value re-issues numbers already printed — the field
  warns but does not block, because rolling back is sometimes what you want.
- **An empty or zero value must never reach Firestore.** `getNextHumanId` reads
  `seq.next || 1`, so a stored `0` or `NaN` silently restarts numbering at `SLCOW_0001`
  and re-issues every number already handed out. The form validates it and
  `updateReceiptNumbering()` throws on anything that is not a whole number ≥ 1.
- **A failed load blocks saving.** `getReceiptNumbering()` throws rather than returning
  an error object, because an error object with no `next` looks exactly like a fresh
  install and would let Save overwrite live numbering with 1. On failure the page shows
  an error and disables Save until reload.
- The page needs an existing `admin` document. If there is none it shows an error rather
  than creating one, same as the navbar avatar upload.

## Adding another tab

Add a `<Tab>` and gate the form body on `tab`. The current single tab renders
unconditionally — split it before adding a second one.
