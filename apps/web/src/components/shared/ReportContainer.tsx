'use client';

import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPdf } from '@/lib/exportToPdf';
import { exportToExcel, type ExcelSheet } from '@/lib/exportToExcel';

interface ReportContainerProps {
  title: string;
  description?: string;
  excelSheets?: ExcelSheet[];
  children: ReactNode;
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Set to true by the Overall Report page so every individual report renders as a plain
 * section (smaller heading, no per-report PDF/Excel buttons) instead of its normal
 * standalone chrome — the combined page captures one PDF for everything itself.
 */
export const ReportEmbedContext = createContext(false);

export function ReportContainer({ title, description, excelSheets, children }: ReportContainerProps) {
  const embedded = useContext(ReportEmbedContext);
  const printRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  async function handlePdfExport() {
    if (!printRef.current) return;
    setIsExportingPdf(true);
    try {
      await exportToPdf(printRef.current, slugify(title));
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExcelExport() {
    if (!excelSheets || excelSheets.length === 0) return;
    setIsExportingExcel(true);
    try {
      await exportToExcel(slugify(title), excelSheets);
    } finally {
      setIsExportingExcel(false);
    }
  }

  if (embedded) {
    return (
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="space-y-6">{children}</div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="flex gap-2">
          {excelSheets && excelSheets.length > 0 && (
            <Button variant="outline" onClick={handleExcelExport} disabled={isExportingExcel}>
              <FileSpreadsheet className="size-4" />
              {isExportingExcel ? 'Exporting...' : 'Excel'}
            </Button>
          )}
          <Button variant="outline" onClick={handlePdfExport} disabled={isExportingPdf}>
            <Download className="size-4" />
            {isExportingPdf ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>
      <div ref={printRef} className="bg-background space-y-6 p-1">
        {children}
      </div>
    </div>
  );
}
