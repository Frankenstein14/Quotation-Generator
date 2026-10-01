import React from 'react';

interface DocumentPageProps {
  pageNumber: number;
  title: string;
  metaRow?: React.ReactNode;
  children: React.ReactNode;
}

export const DocumentPage: React.FC<DocumentPageProps> = ({
  pageNumber,
  title,
  metaRow,
  children
}) => {
  return (
    <div className="a4-document-page shadow-2xl relative select-text text-[#222222]">
      {/* Background Frame (exact ornate maroon border, logo, watermark) */}
      <img
        src="/assets/page_bg_clean.png"
        alt="Page Template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
      />

      <div
        className="absolute z-10 flex flex-col pointer-events-auto"
        style={{
          top: '16mm',
          left: '17mm',
          right: '17mm',
          bottom: '12mm'
        }}
      >
        {/* Header Block: 38mm height vertically centers title with logo (which ends at 54.2mm) */}
        <div
          className="text-center flex flex-col justify-center items-center"
          style={{
            height: '38mm',
            minHeight: '38mm'
          }}
        >
          <h1
            className="font-bold text-center text-[#111111] tracking-wide"
            style={{
              fontFamily: "'Times New Roman', Georgia, serif",
              fontSize: '26pt',
              lineHeight: 1,
              letterSpacing: '1.5px'
            }}
          >
            {title}
          </h1>
          {metaRow && (
            <div
              className="mt-[3.2mm] text-[9.8pt] font-semibold text-[#222222] tracking-wide"
              style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}
            >
              {metaRow}
            </div>
          )}
        </div>

        {/* Crisp Header Divider: placed cleanly below the bottom of the logo at 54.2mm */}
        <div
          className="w-full bg-[#222222]"
          style={{ height: '1.2px', marginTop: '4mm', marginBottom: '4mm' }}
        />

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Page Footer: Centered Page Number & Footer Note */}
        <div className="mt-auto pt-[2mm] text-center pointer-events-none">
          <div
            className="font-medium text-[#222222]"
            style={{ fontSize: '10pt', marginBottom: '2mm' }}
          >
            {pageNumber}
          </div>
          <div
            className="text-[#333333]"
            style={{ fontSize: '7.8pt', letterSpacing: '0.2px' }}
          >
            If you have any questions concerning this quotation, please contact sales team
          </div>
        </div>
      </div>
    </div>
  );
};
