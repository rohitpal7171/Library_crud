# Custom Reusable Components

All components in this folder are shared UI primitives used across pages.

---

## CustomButton

Styled MUI Button with gradient fills, hover effects, and built-in loading state.

```jsx
import CustomButton from '../../components/customComponents/CustomButton';

<CustomButton
  variant="contained"       // 'contained' | 'outlined' | 'text' — default: 'contained'
  colorType="primary"       // 'primary' | 'danger' | 'neutral' — default: 'primary'
  size="medium"             // MUI size
  loading={false}           // shows spinner + "Loading..." text, disables button
  disabled={false}
  fullWidth={false}
  startIcon={<SaveIcon />}
  endIcon={<ArrowIcon />}
  onClick={handleClick}
  sx={{}}                   // additional MUI sx overrides
>
  Save
</CustomButton>
```

**Color types:**
- `primary` — blue gradient (`#1976d2 → #42a5f5`)
- `danger` — red gradient (`#d32f2f → #ef5350`)
- `neutral` — grey (`theme.palette.grey[100]`)

**Loading state:** hides `startIcon`/`endIcon`, shows `CircularProgress` spinner. Button is auto-disabled when `loading=true`.

---

## StatCard (from CustomCard.jsx)

Dashboard metric card with icon, title, count, optional skeleton, optional visibility toggle.

```jsx
import { StatCard } from '../../components/customComponents/CustomCard';

<StatCard
  title="Active Students"
  count={42}
  loading={false}
  icon={PeopleIcon}             // MUI icon component
  iconColor="primary"           // MUI color string
  to="/students"                // optional — wraps card in a router Link
  tooltipHtml="<b>Info</b>"     // optional HTML tooltip on info icon
  borderColor="#d9d9d9"
  height={70}
  cardPadding={2}
  grid={{ xs: 12, sm: 6, md: 3 }}   // MUI Grid size props
  titleVariant="subtitle1"
  countVariant="h6"
  formatCount={(v) => `₹${v}`}      // optional formatter for the count value
  showVisibleFunctionality={false}  // adds eye toggle to hide/show count (used for revenue)
  sx={{}}
/>
```

Wraps in a `<Grid item>` — use inside a `<Grid container>`.

---

## CustomNotifications (Snackbar)

Global notification system. Wrap the app with `SnackbarProvider` (already done in `main.jsx`).

```jsx
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

const { showSnackbar } = useSnackbar();

// Object form:
showSnackbar({ message: 'Saved!', severity: 'success' })

// severity options: 'success' | 'error' | 'warning' | 'info'
```

**Do not** create local Snackbar state in pages — always use this context hook.

---

## CustomSwitch

Styled MUI Switch for boolean toggles (e.g. active/inactive student).

```jsx
import CustomSwitch from '../../components/customComponents/CustomSwitch';

<CustomSwitch
  checked={isActive}
  onChange={(e) => setIsActive(e.target.checked)}
/>
```

---

## CustomDynamicTimeline

Timeline visualization component. Used to display chronological billing history in `StudentDetail`.

```jsx
import CustomDynamicTimeline from '../../components/customComponents/CustomDynamicTimeline';

<CustomDynamicTimeline items={billingHistory} />
```

`items` is an array of billing docs from the `monthlyBilling` subcollection, ordered by `createdAt`.
