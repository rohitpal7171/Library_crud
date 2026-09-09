import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAmount } from './utils.js';

const BRAND = [31, 72, 125];
const MUTED = [110, 110, 110];
const LOGO_FETCH_TIMEOUT_MS = 8000;
const SECTION_BG = [238, 243, 249];

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

export function generateReceiptPdf(model, logoDataUrl) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centre = pageWidth / 2;
  const margin = 20;
  let y = 14;

  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const w = 42;
      const h = (props.height / props.width) * w;
      doc.addImage(logoDataUrl, props.fileType || 'PNG', centre - w / 2, y, w, h);
      y += h + 5;
    } catch (err) {
      console.error('could not place logo on receipt', err);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(model.org.address, centre, y, { align: 'center' });
  y += 4.5;
  doc.text(`Email: ${model.org.email}  |  Contact: ${model.org.phones}`, centre, y, {
    align: 'center',
  });
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND);
  doc.text('FEE RECEIPT', centre, y, { align: 'center' });
  y += 5;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 2.6, lineColor: [214, 222, 232], textColor: [30, 30, 30] },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } },
    body: [
      ['Receipt No.', model.receiptNo],
      ['Amount Paid On', model.paidOn],
      section('STUDENT DETAILS'),
      ['Student Name', model.studentName],
      ['Subscription For', model.subscriptionFor],
      ['Timing', model.timings],
      ['Next Due Date', model.nextDueDate],
      section('FACILITY DETAILS'),
      ['Seat Reserved', model.seatReserved ? 'Yes' : 'No'],
      ['Locker Reserved', model.lockerReserved ? 'Yes' : 'No'],
      section('PAYMENT DETAILS'),
      ['Amount Paid', pdfAmount(model.amountPaid)],
      ['Mode of Payment', model.modeOfPayment],
    ],
    didParseCell: ({ cell }) => {
      if (cell.colSpan !== 2) return;
      cell.styles.fontStyle = 'bold';
      cell.styles.fontSize = 10;
      cell.styles.textColor = BRAND;
      cell.styles.fillColor = SECTION_BG;
      cell.styles.halign = 'center';
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND);
  doc.text('IMPORTANT TERMS & CONDITIONS', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const textWidth = pageWidth - margin * 2 - 4;
  const pageBottom = doc.internal.pageSize.getHeight() - margin;
  model.terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, textWidth);
    const blockHeight = lines.length * 4.2;
    // Start a new page rather than drawing past the bottom, where text is invisible.
    if (y + blockHeight > pageBottom) {
      doc.addPage();
      y = margin;
    }
    doc.text('\u2022', margin, y);
    doc.text(lines, margin + 4, y);
    y += blockHeight + 1.4;
  });

  doc.save(`Receipt_${String(model.receiptNo).replace(/[^\w-]/g, '_')}.pdf`);
}
