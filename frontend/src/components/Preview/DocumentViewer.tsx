import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Printer, RefreshCw } from 'lucide-react';

interface DocumentViewerProps {
  children: React.ReactNode;
  onDownloadPdf: () => Promise<void>;
  isGeneratingPdf?: boolean;
  docTitle?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  children,
  onDownloadPdf,
  isGeneratingPdf = false,
  docTitle = 'Document'
}) => {
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // Auto-fit A4 (~794px) to mobile screen width with margin
      return Math.max(Math.min((window.innerWidth - 32) / 800, 0.55), 0.38);
    }
    return 0.75;
  });

  const zoomIn = () => setScale(prev => Math.min(prev + 0.08, 1.4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.08, 0.3));
  const zoomReset = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setScale(Math.max(Math.min((window.innerWidth - 32) / 800, 0.55), 0.38));
    } else {
      setScale(0.75);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#18161b] border-l border-stone-800">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-[#201d24] border-b border-stone-800 text-stone-200 select-none no-print gap-2">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="font-serif font-bold text-brand-gold text-xs sm:text-sm tracking-wider uppercase">
            <span className="hidden sm:inline">Live A4 Document Preview</span>
            <span className="sm:hidden">Preview</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#141217] rounded-md border border-stone-700/60 p-0.5 text-xs">
            <button
              onClick={zoomOut}
              className="p-1 sm:p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span
              onClick={zoomReset}
              className="px-1.5 sm:px-2 py-0.5 cursor-pointer text-stone-400 hover:text-white font-mono text-[11px] sm:text-xs"
              title="Reset Zoom to fit screen"
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 sm:p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Print button (desktop only) */}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 hover:bg-stone-700 border border-stone-700/80 rounded-md text-xs font-medium text-stone-200 transition"
            title="Print Document"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon text-brand-gold-light border border-brand-gold/40 rounded-md text-xs font-semibold shadow-lg hover:shadow-brand-maroon/40 transition disabled:opacity-50"
            title="Generate & Download Multi-Page A4 PDF"
          >
            {isGeneratingPdf ? (
              <>
                <RefreshCw size={13} className="animate-spin text-brand-gold" />
                <span>PDF...</span>
              </>
            ) : (
              <>
                <Download size={13} className="text-brand-gold" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Document View Canvas */}
      <div className="flex-1 overflow-auto p-2 sm:p-8 flex justify-center bg-[#131116] min-h-0 print:p-0 print:bg-white">
        <div
          className="transition-transform duration-150 origin-top flex flex-col items-center"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
