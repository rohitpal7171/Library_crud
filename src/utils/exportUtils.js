import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(rows, columns, filename) {
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = columns.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(rows, columns, title, subtitle = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(subtitle, 14, 25);
  }
  doc.setTextColor(0, 0, 0);
  autoTable(doc, {
    startY: subtitle ? 30 : 24,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? '')),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
