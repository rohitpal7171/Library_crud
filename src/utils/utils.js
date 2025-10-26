export const defaultBoxPadding = '20px';

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
