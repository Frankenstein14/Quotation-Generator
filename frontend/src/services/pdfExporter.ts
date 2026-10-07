// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PdfExportOptions {
  filename?: string;
  elementId?: string;
}

export async function exportDocumentToPdf(options: PdfExportOptions = {}): Promise<void> {
  const elementId = options.elementId || 'printable-document-area';
  const element = document.getElementById(elementId);
  
  if (!element) {
    // If element not found, fallback to browser print
    window.print();
    return;
  }

  const filename = options.filename || 'Document.pdf';

  // Find all A4 document pages inside the container
  const pages = element.querySelectorAll<HTMLElement>('.a4-document-page');
  if (pages.length === 0) {
    window.print();
    return;
  }

  // Create an offscreen export container with exact 210mm width and no scaling
  const exportContainer = document.createElement('div');
  exportContainer.id = 'pdf-export-temporary-container';
  exportContainer.style.position = 'absolute';
  exportContainer.style.left = '0';
  exportContainer.style.top = '0';
  exportContainer.style.width = '210mm';
  exportContainer.style.background = '#ffffff';
  exportContainer.style.zIndex = '-99999';
  exportContainer.style.pointerEvents = 'none';
  exportContainer.style.boxSizing = 'border-box';

  // Clone each page so it retains exact styles and crisp backgrounds
  pages.forEach((page, index) => {
    const clone = page.cloneNode(true) as HTMLElement;
    clone.style.width = '210mm';
    clone.style.height = '297mm';
    clone.style.minWidth = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.maxWidth = '210mm';
    clone.style.maxHeight = '297mm';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.boxShadow = 'none';
    clone.style.transform = 'none';
    clone.style.position = 'relative';
    clone.style.overflow = 'hidden';
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';
    clone.style.display = 'block';
    
    // Page break after every page except the last
    if (index < pages.length - 1) {
      clone.style.pageBreakAfter = 'always';
      clone.style.breakAfter = 'page';
    }

    exportContainer.appendChild(clone);
  });

  document.body.appendChild(exportContainer);

  // Ensure all images (e.g. background frame) inside the export container are loaded
  const images = Array.from(exportContainer.querySelectorAll('img'));
  await Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  const opt = {
    margin: 0,
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2, // Crisp 2x retina print resolution
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
      windowWidth: 794 // 210mm at 96 DPI
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const
    },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  try {
    await html2pdf().set(opt).from(exportContainer).save();
  } catch (err) {
    console.warn('html2pdf generation error, falling back to window.print():', err);
    window.print();
  } finally {
    if (document.body.contains(exportContainer)) {
      document.body.removeChild(exportContainer);
    }
  }
}
