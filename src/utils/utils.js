export const defaultBoxPadding = '20px';
export const defaultBorderColor = '#d9d9d9';

export const defaultSchemaValues = {
  studentName: '',
  fatherName: '',
  dateOfBirth: '',
  dateOfJoining: '',
  gender: 'Male',
  phoneNumber: '',
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
  monthlyBilling: {
    subscriptionType: 'month',
    subscriptionDuration: 1,
    basicFee: 0,
    lockerFee: 0,
    seatFee: 0,
  },
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
