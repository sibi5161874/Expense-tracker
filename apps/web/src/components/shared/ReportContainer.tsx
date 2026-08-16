'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import { ProLockedButton } from '@/components/shared/ProGate';
import { exportReportToPdf } from '@/lib/exportToPdf';
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
 * Provided by the Overall Report page, which renders every report as a plain section
 * (smaller heading, no per-report export buttons) and exports all of them as one
 * document. A non-null value is what "embedded" means — there's no separate boolean to
 * keep in sync — and `register` is how each embedded report hands its tabular data up so
 * the parent can build the combined PDF from data rather than screenshotting the page.
 */
export interface ReportEmbedRegistry {
  register: (title: string, sheets: ExcelSheet[]) => void;
}

export const ReportEmbedContext = createContext<ReportEmbedRegistry | null>(null);

export function ReportContainer({ title, description, excelSheets, children }: ReportContainerProps) {
  const embed = useContext(ReportEmbedContext);
  const router = useRouter();
  const { hasFeature } = useEntitlements();
  const canExport = hasFeature('reportExport');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Runs on every render because `excelSheets` is a fresh array literal each time. That's
  // intentional and safe: register() only writes into a ref on the parent, so it never
  // triggers a re-render and can't loop. Re-registering also keeps the parent's copy
  // current as each report's async data resolves.
  useEffect(() => {
    if (embed && excelSheets && excelSheets.length > 0) {
      embed.register(title, excelSheets);
    }
  }, [embed, title, excelSheets]);

  function goToUpgrade() {
    toast.info('Exporting reports is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  // PDF is built straight from the same tabular data as Excel (jsPDF + autoTable draws
  // vector text, no DOM screenshot). Nothing in this path reads computed styles, so the
  // modern-CSS-color parse failures that plague canvas-based exporters can't occur.
  function handlePdfExport() {
    if (!excelSheets || excelSheets.length === 0) return;
    setIsExportingPdf(true);
    try {
      exportReportToPdf(title, description ?? '', excelSheets, slugify(title));
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

  if (embed) {
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

  const hasExportableData = !!excelSheets && excelSheets.length > 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        {hasExportableData && (
          <div className="flex gap-2">
            {canExport ? (
              <>
                <Button variant="outline" onClick={handleExcelExport} disabled={isExportingExcel}>
                  <FileSpreadsheet className="size-4" />
                  {isExportingExcel ? 'Exporting...' : 'Excel'}
                </Button>
                <Button variant="outline" onClick={handlePdfExport} disabled={isExportingPdf}>
                  <Download className="size-4" />
                  {isExportingPdf ? 'Exporting...' : 'PDF'}
                </Button>
              </>
            ) : (
              <ProLockedButton label="Export" onUpgradeClick={goToUpgrade} />
            )}
          </div>
        )}
      </div>
      <div className="bg-background space-y-6 p-1">{children}</div>
    </div>
  );
}
