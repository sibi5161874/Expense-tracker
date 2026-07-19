import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cssColorToHex, resolveOklchColors } from './resolveOklchColors';

/** Snapshots a DOM element (tables, charts, everything) into a paginated PDF and downloads it. */
export async function exportToPdf(element: HTMLElement, filename: string) {
  const backgroundColor = cssColorToHex(getComputedStyle(document.body).backgroundColor) || '#ffffff';

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale: 2,
    onclone: (_doc, clonedElement) => resolveOklchColors(clonedElement),
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${filename}.pdf`);
}
