export const defaultBoxPadding = '20px';
export const defaultBorderColor = '#d9d9d9';
export const labelSx = { fontSize: 13, fontWeight: 600, mb: 0.5 };

export const defaultMonthlyPaymentSchema = {
  subscriptionType: 'month',
  subscriptionDuration: 1,
  basicFee: 0,
  lockerFee: 0,
  seatFee: 0,
  paymentBy: 'CASH',
};

export const defaultSchemaValues = {
  studentName: '',
  fatherName: '',
  dateOfBirth: '',
  dateOfJoining: '',
  gender: 'Male',
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
  window.open(webUrl, '_blank');
};

export const safeValue = (val) => (val ? val : '--');
