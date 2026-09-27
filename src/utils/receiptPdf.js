import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAmount } from './utils.js';

const BRAND = [31, 72, 125];
const GOLD = [201, 157, 61];
const MUTED = [110, 110, 110];
const LINE = [214, 222, 232];
const LABEL_BG = [246, 249, 252];
const LOGO_FETCH_TIMEOUT_MS = 8000;

// Where the printed content starts, and the two lines that make up the border: a
// navy frame and a thin gold one just inside it. Each corner is a concave notch —
// the curve bites INTO the shape, opposite of a normal rounded rectangle — with a
// small gold square sitting apart from both lines, a clean gap on every side.
const MARGIN = 18;
const FRAME_OUTER = 8;
const FRAME_GOLD = 11;
const OUTER_RADIUS = 7;
const GOLD_RADIUS = 5.5;
const CORNER_SQUARE = 3.5;
const CORNER_SQUARE_CENTER = 7.5;
const NOTCH_SEGMENTS = 10;

// A rounded rect's corner arc is centred INSET from the true corner, bulging outward
// (a normal round). This centres the arc ON the true corner instead, so it bulges
// INTO the rectangle — a concave bite. Returns the closed path as absolute points,
// approximated with straight segments (smooth enough at this scale).
const notchedRectPoints = (x, y, w, h, r) => {
  const pts = [];
  const arc = (cx, cy, fromDeg, toDeg) => {
    for (let i = 0; i <= NOTCH_SEGMENTS; i++) {
      const deg = fromDeg + ((toDeg - fromDeg) * i) / NOTCH_SEGMENTS;
      const rad = (deg * Math.PI) / 180;
      pts.push([cx + r * Math.cos(rad), cy + r * Math.sin(rad)]);
    }
  };
  pts.push([x + r, y]);
  pts.push([x + w - r, y]);
  arc(x + w, y, 180, 90); // top-right notch, centred on that true corner
  pts.push([x + w, y + h - r]);
  arc(x + w, y + h, 270, 180); // bottom-right
  pts.push([x + r, y + h]);
  arc(x, y + h, 0, -90); // bottom-left
  pts.push([x, y + r]);
  arc(x, y, 90, 0); // top-left — closes back to the first point
  return pts;
};

const strokeNotchedRect = (doc, x, y, w, h, r, color, lineWidth) => {
  const pts = notchedRectPoints(x, y, w, h, r);
  const deltas = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], 'S', true);
};

// jsPDF's built-in fonts are WinAnsi encoded and have no glyph for the rupee sign,
// so receipts print "Rs." instead of formatCurrency()'s ₹.
const pdfAmount = (n) => `Rs. ${formatAmount(n)}`;

// addImage needs the bytes, not a URL. Cloudinary sends CORS headers, so this works
// for the header logo without any extra config.
export async function imageUrlToDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('receipt logo fetch failed', err);
    return null;
  }
}

// Section headers are the only full-width rows, so colSpan is enough to spot them.
const section = (label) => [{ content: label, colSpan: 2 }];

// The border: two rounded lines only — a heavy navy frame and a thin gold one just
// inside it. Every page gets one, or a receipt that spills onto page two would look
// like a different document.
const drawFrame = (doc) => {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  strokeNotchedRect(
    doc,
    FRAME_OUTER,
    FRAME_OUTER,
    w - FRAME_OUTER * 2,
    h - FRAME_OUTER * 2,
    OUTER_RADIUS,
    BRAND,
    1
  );
  strokeNotchedRect(
    doc,
    FRAME_GOLD,
    FRAME_GOLD,
    w - FRAME_GOLD * 2,
    h - FRAME_GOLD * 2,
    GOLD_RADIUS,
    GOLD,
    0.5
  );

  // A small gold square sits inside each notch, clear of both curves — a separate
  // ornament, not touching or merging with either line.
  const half = CORNER_SQUARE / 2;
  doc.setFillColor(...GOLD);
  [
    [CORNER_SQUARE_CENTER, CORNER_SQUARE_CENTER],
    [w - CORNER_SQUARE_CENTER, CORNER_SQUARE_CENTER],
    [CORNER_SQUARE_CENTER, h - CORNER_SQUARE_CENTER],
    [w - CORNER_SQUARE_CENTER, h - CORNER_SQUARE_CENTER],
  ].forEach(([x, y]) => doc.rect(x - half, y - half, CORNER_SQUARE, CORNER_SQUARE, 'F'));
};

// jsPDF has no icon font, so the header icons are drawn from primitives. Each one is
// ICON_W wide and sits on the text baseline it is passed.
const ICON_W = 3.4;

const pinIcon = (doc, x, y) => {
  doc.setFillColor(...BRAND);
  doc.circle(x + 1.6, y - 2.3, 1.45, 'F');
  doc.triangle(x + 0.45, y - 1.6, x + 2.75, y - 1.6, x + 1.6, y - 0.1, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 1.6, y - 2.35, 0.55, 'F');
};

const mailIcon = (doc, x, y) => {
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.3);
  doc.rect(x, y - 2.6, ICON_W, 2.5);
  doc.line(x, y - 2.6, x + ICON_W / 2, y - 1.2);
  doc.line(x + ICON_W / 2, y - 1.2, x + ICON_W, y - 2.6);
};

const phoneIcon = (doc, x, y) => {
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + 0.6, y - 2.9, 2.2, 2.9, 0.5, 0.5);
  doc.line(x + 1.25, y - 2.45, x + 2.15, y - 2.45);
  doc.setFillColor(...BRAND);
  doc.circle(x + 1.7, y - 0.55, 0.22, 'F');
};

// A rule either side of a centred word, as on the tagline and the FEE RECEIPT banner.
const flankingRules = (doc, y, halfGap, reach) => {
  const centre = doc.internal.pageSize.getWidth() / 2;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(centre - halfGap - reach, y, centre - halfGap, y);
  doc.line(centre + halfGap, y, centre + halfGap + reach, y);
};

// Shrinks the text until it fits, so a longer library name can never run into the logo.
const fitFontSize = (doc, text, maxWidth, startSize) => {
  let size = startSize;
  doc.setFontSize(size);
  while (size > 9 && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
};

export function generateReceiptPdf(model, logoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centre = pageWidth / 2;
  drawFrame(doc);

  let y = 19;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND);
  const strip = 'R E A D   |   S T U D Y   |   W O R K   |   B E L O N G';
  doc.text(strip, pageWidth - MARGIN, y, { align: 'right' });
  const stripLeft = pageWidth - MARGIN - doc.getTextWidth(strip);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(stripLeft - 11, y - 1, stripLeft - 3, y - 1);

  y += 5;
  // The logo sits on the left and the name block stays centred on the page, so the
  // name has to clear the logo on both sides to stay visually centred.
  let logoRight = MARGIN;
  let headerBottom = y;
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const w = 26;
      const h = (props.height / props.width) * w;
      doc.addImage(logoDataUrl, props.fileType || 'PNG', MARGIN, y, w, h);
      logoRight = MARGIN + w;
      headerBottom = y + h;
    } catch (err) {
      console.error('could not place logo on receipt', err);
    }
  }

  const nameWidth = pageWidth - (logoRight + 4) * 2;
  y += 8;
  doc.setFont('times', 'bold');
  doc.setTextColor(...BRAND);
  const nameSize = fitFontSize(doc, model.org.name, nameWidth, 21);
  doc.text(model.org.name, centre, y, { align: 'center' });

  y += nameSize * 0.32 + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND);
  const tagline = String(model.org.tagline ?? '')
    .split('')
    .join(' ');
  doc.text(tagline, centre, y, { align: 'center' });
  if (tagline) flankingRules(doc, y - 1.2, doc.getTextWidth(tagline) / 2 + 5, 5);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND);

  // Icon and text are one centred group, so the icon cannot drift off the text.
  const address = String(model.org.address ?? '');
  let x = centre - (ICON_W + 2 + doc.getTextWidth(address)) / 2;
  pinIcon(doc, x, y);
  doc.text(address, x + ICON_W + 2, y);

  y += 5;
  const email = String(model.org.email ?? '');
  const phones = String(model.org.phones ?? '');
  const gap = '   |   ';
  const contactWidth =
    ICON_W * 2 + 4 + doc.getTextWidth(email) + doc.getTextWidth(gap) + doc.getTextWidth(phones);
  x = centre - contactWidth / 2;
  mailIcon(doc, x, y);
  x += ICON_W + 2;
  doc.text(email, x, y);
  x += doc.getTextWidth(email);
  doc.text(gap, x, y);
  x += doc.getTextWidth(gap);
  phoneIcon(doc, x, y);
  x += ICON_W + 2;
  doc.text(phones, x, y);

  y = Math.max(y, headerBottom) + 9;

  // The FEE RECEIPT banner.
  const bannerW = 68;
  const bannerH = 11;
  doc.setFillColor(...BRAND);
  doc.roundedRect(centre - bannerW / 2, y, bannerW, bannerH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('FEE RECEIPT', centre, y + bannerH / 2 + 1.9, { align: 'center' });
  flankingRules(doc, y + bannerH / 2, bannerW / 2 + 5, 28);

  y += bannerH + 6;

  const tableStyles = {
    fontSize: 10,
    cellPadding: 2.6,
    lineColor: LINE,
    lineWidth: 0.2,
    textColor: [30, 30, 30],
  };

  // The receipt number and paid-on date share one four-cell strip above the sections.
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: tableStyles,
    columnStyles: {
      0: { cellWidth: 33, fontStyle: 'bold', fillColor: LABEL_BG, textColor: BRAND },
      1: { cellWidth: 57 },
      2: { cellWidth: 45, fontStyle: 'bold', fillColor: LABEL_BG, textColor: BRAND },
    },
    body: [['Receipt No.', model.receiptNo, 'Amount Paid On', model.paidOn]],
    didDrawPage: () => drawFrame(doc),
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    theme: 'grid',
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
    styles: tableStyles,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: LABEL_BG, textColor: [40, 40, 40] },
    },
    body: [
      section('STUDENT DETAILS'),
      ['Student Name', model.studentName],
      ['Subscription For', model.subscriptionFor],
      ['Timing', model.timings],
      ['Next Due Date', model.nextDueDate],
      section('FACILITY DETAILS'),
      ['Seat Reserved', model.seatReserved ? 'Yes' : 'No'],
      ['Locker Reserved', model.lockerReserved ? 'Yes' : 'No'],
      section('PAYMENT DETAILS'),
      ['Amount Paid', `${pdfAmount(model.amountPaid)}  (${model.amountPaidWords})`],
      ['Amount Due', pdfAmount(model.amountDue)],
      ['Mode of Payment', model.modeOfPayment],
    ],
    didParseCell: ({ cell }) => {
      if (cell.colSpan !== 2) return;
      cell.styles.fontStyle = 'bold';
      cell.styles.fontSize = 10;
      cell.styles.textColor = [255, 255, 255];
      cell.styles.fillColor = BRAND;
      cell.styles.halign = 'left';
      cell.styles.cellPadding = { top: 2.6, bottom: 2.6, left: 6, right: 2.6 };
    },
    didDrawPage: () => drawFrame(doc),
  });

  y = doc.lastAutoTable.finalY + 4;

  const contentWidth = pageWidth - MARGIN * 2;
  const pageBottom = doc.internal.pageSize.getHeight() - MARGIN;

  doc.setFillColor(...BRAND);
  doc.rect(MARGIN, y, contentWidth, 8.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('IMPORTANT TERMS & CONDITIONS', MARGIN + 6, y + 5.9);
  y += 8.5 + 5;

  const termIndent = 9;
  const textWidth = contentWidth - termIndent - 4;
  model.terms.forEach((term, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(term, textWidth);
    const blockHeight = lines.length * 3.9;
    // Start a new page rather than drawing past the bottom, where text is invisible.
    if (y + blockHeight > pageBottom) {
      doc.addPage();
      drawFrame(doc);
      y = MARGIN;
    }
    doc.setFillColor(...GOLD);
    doc.circle(MARGIN + 3.4, y - 1.1, 2.4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(String(index + 1), MARGIN + 3.4, y + 0.4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(lines, MARGIN + termIndent, y, { lineHeightFactor: 1.35 });
    y += blockHeight + 1.6;
  });

  doc.save(`Receipt_${String(model.receiptNo).replace(/[^\w-]/g, '_')}.pdf`);
}
