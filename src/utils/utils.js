export const defaultBoxPadding = '20px';
export const defaultBorderColor = '#d9d9d9';
export const labelSx = { fontSize: 13, fontWeight: 600, mb: 0.5 };
export const defaultDashboardBackgroundColor = '#f0f4f8';
export const defaultBoxBorderRadius = 4;

export const sidebarColors = {
  background: '#0d1b3d',
  border: 'rgba(255,255,255,0.08)',
  itemHoverBg: 'rgba(255,255,255,0.08)',
  activeBg: 'rgba(255,255,255,0.08)',
  activeHoverBg: 'rgba(255,255,255,0.12)',
  activeGlow: 'none',
  activeContent: '#ffffff',
  activeAccent: '#3b82f6',
  iconInactive: 'rgba(255,255,255,0.85)',
  labelInactive: '#ffffff',
  signOutIcon: 'rgba(248,113,113,0.8)',
  signOutLabel: 'rgba(248,113,113,0.85)',
  signOutHover: '#fca5a5',
  signOutHoverBg: 'rgba(239,68,68,0.15)',
};

export const defaultMonthlyPaymentSchema = {
  subscriptionType: 'month',
  subscriptionDuration: 1,
  basicFee: 0,
  lockerFee: 0,
  seatFee: 0,
  paymentBy: '',
  nextPaymentDate: '',
  paymentDate: '',
};

export const defaultSchemaValues = {
  studentName: '',
  fatherName: '',
  dateOfBirth: '',
  dateOfJoining: '',
  gender: '',
  phoneNumber: '',
  phoneNumber2: '',
  referredBy: '',
  seatReserved: false,
  seatNumber: 0,
  locker: false,
  lockerNumber: 0,
  timings: '6',
  address: '',
  documents: [],
  studentProfile: '',
  aadhaarNumber: '',
  active: true,
  monthlyBilling: defaultMonthlyPaymentSchema,
};

export const expenseType = {
  Rent: 'Rent',
  Salary: 'Salary',
  Cleaner: 'Cleaner',
  'Water bill': 'Water bill',
  'Electricity bill': 'Electricity bill',
  'Internet bill': 'Internet bill',
  Stationery: 'Stationery',
  Repairs: 'Repairs',
  Miscellaneous: 'Miscellaneous',
};

export const defaultExpenseSchemaValues = {
  expenseType: 'Rent',
  miscellaneous: '',
  expensePaid: 0,
  expenseDate: '',
  expensePaymentMethod: '',
  remarks: '',
};

export const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 KB';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${sizes[i]}`;
};

export const formatDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('error while formatting date', e);
    return s;
  }
};

export const defaultCheckValue = (v) => v !== undefined && v !== null && v !== '';

// --- helpers ---
const clampToMonthEnd = (y, m, d) => {
  // m: 0–11
  const lastDay = new Date(y, m + 1, 0).getDate();
  return Math.min(d, lastDay);
};

export const addMonthsPreserveDay = (date, months) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const targetMonthIndex = m + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const day = clampToMonthEnd(targetYear, targetMonth, d);
  return new Date(targetYear, targetMonth, day);
};

export const addYearsPreserveDay = (date, years) => {
  const y = date.getFullYear() + years;
  const m = date.getMonth();
  const d = date.getDate();
  // handle Feb 29 → Feb 28 on non-leap year
  const day = clampToMonthEnd(y, m, d);
  return new Date(y, m, day);
};

export const computeNextPaymentDate = (startDate, type, duration) => {
  const dur = Number(duration);

  // 🧩 Validate input
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) return null;
  if (!type || !dur || Number.isNaN(dur) || dur <= 0) return null;

  // 📅 Add months or years
  if (type === 'month') return addMonthsPreserveDay(startDate, dur);
  if (type === 'year') return addYearsPreserveDay(startDate, dur);

  return null;
};

// ✅ Converts Firestore Timestamp → JS Date safely
export const firebaseTimestampToDate = (ts) => {
  if (!ts) return null;

  try {
    // Already a JS Date
    if (ts instanceof Date) return ts;

    // Firestore Timestamp object
    if (typeof ts === 'object' && 'seconds' in ts) {
      const ms = ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
      return new Date(ms);
    }

    // String / number fallback
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

export const formatFirebaseTimestamp = (ts, options = {}) => {
  const date = firebaseTimestampToDate(ts);
  if (!date) return '—';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

export const formatMonthYear = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  });
};

export const getDueDateDisplay = (timestamp) => {
  const date = firebaseTimestampToDate(timestamp);
  if (!date) return { text: '—', color: 'text.primary', fontWeight: 400 };

  const today = new Date();
  const diffDays = Math.floor((new Date(date) - today) / (1000 * 60 * 60 * 24));

  let color = 'text.primary';
  let fontWeight = 400;

  if (diffDays < 0 || diffDays === 0) {
    color = 'error.main';
    fontWeight = 600;
  } else if (diffDays <= 7) {
    color = 'warning.main';
    fontWeight = 600;
  }

  return { text: formatDate(date), color, fontWeight };
};

export function buildWhatsAppLink(rawNumber, text) {
  const e164 = rawNumber.replace(/\D/g, ''); // e.g. 919144321129
  const t = text ? encodeURIComponent(text) : '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Desktop → go directly to WhatsApp Web chat (no interstitial)
  if (!isMobile) {
    return `https://web.whatsapp.com/send?phone=${e164}${t ? `&text=${t}` : ''}`;
  }

  // Mobile → universal link that opens the app
  return `https://wa.me/${e164}${t ? `?text=${t}` : ''}`;
}

export const sendMessageOnWhatsApp = (NumberAsE164, textToBeSend) => {
  const webUrl = buildWhatsAppLink(NumberAsE164, textToBeSend);
  _openWhatsAppUrl(webUrl);
};

// Shared tab reference — persists for the page session
let _whatsappTab = null;

// Reuses the existing WhatsApp tab if still open, otherwise opens a new one
const _openWhatsAppUrl = (url) => {
  if (_whatsappTab && !_whatsappTab.closed) {
    _whatsappTab.location.href = url;
    _whatsappTab.focus();
  } else {
    _whatsappTab = window.open(url, '_blank');
  }
};

// Builds a personalised payment reminder message for a single student
export const buildPaymentReminderMessage = (student) => {
  const bill = student?.subcollections?.monthlyBilling?.[0];
  const ts = bill?.nextPaymentDate;
  const dueDate = ts
    ? (ts?.seconds != null ? new Date(ts.seconds * 1000) : new Date(ts)).toLocaleDateString(
        'en-IN',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : '—';
  const amount =
    student.due_amount ||
    parseInt(bill?.basicFee || 0) + parseInt(bill?.seatFee || 0) + parseInt(bill?.lockerFee || 0);
  const name = student.studentName || 'Student';

  return [
    `📚 *Shivaay Library & Co-working*`,
    ``,
    `Hi *${name}* 🙏`,
    ``,
    `We hope your studies are going great! 🌟`,
    ``,
    `This is a gentle reminder that your library subscription is due:`,
    ``,
    `💳 Amount Due : *₹${amount.toLocaleString()}*`,
    `📅 Due Date   : *${dueDate}*`,
    ``,
    `Please renew at your earliest convenience so your favourite study spot stays reserved for you! 😊`,
    ``,
    `_Thank you for being a valued member_ 🎓`,
    `_— *Team Shivaay Library* ✨`,
  ].join('\n');
};

// Layer 1 — open WhatsApp with any pre-built message string (no specific contact)
export const openWhatsApp = (message) => {
  if (!message) return;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile
    ? `https://wa.me/?text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  _openWhatsAppUrl(url);
};

// Layer 2 — build a branded message from any title + string rows
// options: { emoji, footer, showDate }
export const buildWhatsAppMessage = (title, rows, options = {}) => {
  const { emoji = '📋', footer = '', showDate = true } = options;
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return [
    `${emoji} *Shivaay Library — ${title}*`,
    ...(showDate ? [`📅 ${today}`] : []),
    '',
    ...rows,
    ...(footer ? ['', footer] : []),
  ].join('\n');
};

// Layer 3 — student-list convenience wrapper (builds rows from student objects)
// options: { emoji, totalLabel }
export const shareStudentListOnWhatsApp = (title, students, options = {}) => {
  if (!students?.length) return;

  const { emoji = '📋', totalLabel = 'Total Due' } = options;

  const rows = students.map((s, i) => {
    const bill = s?.subcollections?.monthlyBilling?.[0];
    const ts = bill?.nextPaymentDate;
    const dueDate = ts
      ? (ts?.seconds != null ? new Date(ts.seconds * 1000) : new Date(ts)).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short', year: 'numeric' }
        )
      : '—';
    const amount = s.due_amount || 0;
    return `${i + 1}. ${s.studentName} — ₹${amount.toLocaleString()} (Due: ${dueDate})`;
  });

  const total = students.reduce((sum, s) => sum + (s.due_amount || 0), 0);
  const footer = `💰 *${totalLabel}: ₹${total.toLocaleString()}*`;

  openWhatsApp(buildWhatsAppMessage(title, rows, { emoji, footer }));
};

export const safeValue = (val) => (val ? val : '--');

export const showSubscriptionType = (type) => {
  return type === 'month' ? 'Monthly' : 'Yearly';
};

export const dateToString = (d) => {
  try {
    if (!d) return '';
    const dateObj = d instanceof Date ? d : new Date(d);
    const local = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  } catch (err) {
    console.log('error while formatting date', err);
    return '';
  }
};

export const financialMonthOrder = [
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
];

export const monthOrder = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const currentYear = new Date().getFullYear();
export const currentMonth = new Date().getMonth();

// Decide FY start year (India logic)
export const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
export const fyEndYear = fyStartYear + 1;

// Build ordered months with year
export const financialMonthsWithYear = [
  ...financialMonthOrder.slice(0, 9).map((m) => `${m} ${fyStartYear}`), // Apr–Dec
  ...financialMonthOrder.slice(9).map((m) => `${m} ${fyStartYear + 1}`), // Jan–Mar
];
