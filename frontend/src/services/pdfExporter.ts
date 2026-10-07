import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  elementId?: string;
}

/**
 * High-fidelity Multi-Page PDF Exporter:
 * Temporarily resets container transform to 1:1,
 * captures every `.a4-document-page` element directly from the rendered DOM at 2x retina print resolution,
 * compiles all pages into a crisp multi-page A4 PDF (210mm x 297mm),
 * and restores the container zoom transform seamlessly.
 */
export async function exportDocumentToPdf(options: PdfExportOptions = {}): Promise<void> {
  const elementId = options.elementId || 'printable-document-area';
  const container = document.getElementById(elementId);
  
  if (!container) {
    window.print();
    return;
  }

  const rawFilename = options.filename || 'Document.pdf';
  const filename = rawFilename.endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;

  // Find all A4 document pages inside the container
  const pages = Array.from(container.querySelectorAll<HTMLElement>('.a4-document-page'));
  if (pages.length === 0) {
    window.print();
    return;
  }

  // Temporarily reset transform to 'none' on the container so pages render at true 1:1 scale
  const prevTransform = container.style.transform;
  container.style.transform = 'none';

  // Ensure all images in the document (background frame, logos) are loaded
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Render exact A4 canvas directly from DOM at 2x crisp print scale
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    pdf.save(filename);
  } catch (err) {
    console.warn('Direct jsPDF export error, falling back to window.print():', err);
    window.print();
  } finally {
    container.style.transform = prevTransform;
  }
}
