import { useState } from 'react';
import { FileDownload, PictureAsPdf } from '@mui/icons-material';
import { exportToExcel, exportToPDF } from '../../../utils/exportUtils';

export default function ExportButtons({ rows, columns, filename, title, subtitle = '' }) {
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExcel = () => {
    setExcelLoading(true);
    setTimeout(() => {
      try {
        exportToExcel(rows, columns, filename);
      } finally {
        setExcelLoading(false);
      }
    }, 60);
  };

  const handlePDF = () => {
    setPdfLoading(true);
    setTimeout(() => {
      try {
        exportToPDF(rows, columns, title, subtitle);
      } finally {
        setPdfLoading(false);
      }
    }, 60);
  };

  return (
    <div className="flex gap-2 ml-auto">
      <button
        onClick={handleExcel}
        disabled={excelLoading || pdfLoading}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-sm font-medium rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        style={{ color: '#16a34a' }}
      >
        {excelLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileDownload sx={{ fontSize: 16, color: '#16a34a' }} />
        )}
        Excel
      </button>

      <button
        onClick={handlePDF}
        disabled={excelLoading || pdfLoading}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {pdfLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <PictureAsPdf sx={{ fontSize: 16, color: '#dc2626' }} />
        )}
        <span className={pdfLoading ? 'text-slate-400' : ''}>PDF</span>
      </button>
    </div>
  );
}
