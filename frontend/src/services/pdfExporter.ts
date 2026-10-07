import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  filename?: string;
  elementId?: string;
}

/**
 * High-fidelity Multi-Page PDF Exporter:
 * Iterates through every `.a4-document-page` in the document,
 * renders each page independently at 2x crisp print resolution into true A4 dimensions (210mm x 297mm),
 * and compiles them into a single multi-page PDF download.
 */
export async function exportDocumentToPdf(options: PdfExportOptions = {}): Promise<void> {
  const elementId = options.elementId || 'printable-document-area';
  const element = document.getElementById(elementId);
  
  if (!element) {
    window.print();
    return;
  }

  const rawFilename = options.filename || 'Document.pdf';
  const filename = rawFilename.endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;

  // Find all A4 document pages inside the container
  const pages = Array.from(element.querySelectorAll<HTMLElement>('.a4-document-page'));
  if (pages.length === 0) {
    window.print();
    return;
  }

  // Create isolated offscreen staging container with exact A4 dimensions
  const stagingContainer = document.createElement('div');
  stagingContainer.id = 'pdf-render-staging';
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '0';
  stagingContainer.style.top = '0';
  stagingContainer.style.width = '794px'; // 210mm at 96 DPI
  stagingContainer.style.height = '1123px'; // 297mm at 96 DPI
  stagingContainer.style.zIndex = '-99999';
  stagingContainer.style.background = '#ffffff';
  stagingContainer.style.overflow = 'hidden';
  stagingContainer.style.pointerEvents = 'none';
  stagingContainer.style.boxSizing = 'border-box';
  document.body.appendChild(stagingContainer);

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const clone = page.cloneNode(true) as HTMLElement;

      clone.style.width = '794px';
      clone.style.height = '1123px';
      clone.style.minWidth = '794px';
      clone.style.minHeight = '1123px';
      clone.style.maxWidth = '794px';
      clone.style.maxHeight = '1123px';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.boxShadow = 'none';
      clone.style.transform = 'none';
      clone.style.position = 'relative';
      clone.style.overflow = 'hidden';
      clone.style.boxSizing = 'border-box';
      clone.style.backgroundColor = '#ffffff';
      clone.style.display = 'block';

      stagingContainer.innerHTML = '';
      stagingContainer.appendChild(clone);

      // Ensure all images in clone (background frame, logos) are loaded
      const images = Array.from(clone.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );

      // Render exact A4 canvas at 2x crisp print scale
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollY: 0,
        scrollX: 0,
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
    if (document.body.contains(stagingContainer)) {
      document.body.removeChild(stagingContainer);
    }
  }
}
