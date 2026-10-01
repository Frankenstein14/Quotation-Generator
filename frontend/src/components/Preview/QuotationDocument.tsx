import React from 'react';
import { Quotation } from '../../types';
import { DocumentPage } from './DocumentPage';
import {
  paginateInclusions,
  paginateQuotationItems,
  paginateTerms
} from '../../services/pagination';

interface QuotationDocumentProps {
  quotation: Quotation;
}

function formatCurrency(val?: number | string): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  return 'Rs. ' + num.toLocaleString('en-IN');
}

function getCleanEventName(event?: { name?: string; type?: string }): string {
  if (!event) return 'Event';
  const type = (event.type || '').trim();
  const name = (event.name || '').trim();
  if (name && type) {
    if (name.toLowerCase() === type.toLowerCase()) return name;
    if (name.toLowerCase().includes(type.toLowerCase())) return name;
    return `${type} (${name})`;
  }
  return name || type || 'Event';
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({ quotation: q }) => {
  // Step 1: Inclusions start on Page 1 (per explicit user instruction)
  const inclusionsPages = paginateInclusions(q.inclusions || [], 1);
  const nextStartPage = inclusionsPages.length + 1;

  // Step 2: Quotation Items follow Inclusions
  const itemsPages = paginateQuotationItems(q.items || [], q.quotationNumber, nextStartPage);
  const termsStartPage = nextStartPage + itemsPages.length;

  // Step 3: Terms & Contact/Payment follow Items
  const termsPages = paginateTerms(q.terms || [], q.quotationNumber, termsStartPage);

  return (
    <div className="flex flex-col gap-8 items-center py-4 print:p-0 print:gap-0">
      {/* 1. Inclusions Pages (Page 1+) */}
      {inclusionsPages.map((ip) => (
        <DocumentPage
          key={`inc-${ip.pageNumber}`}
          pageNumber={ip.pageNumber}
          title={ip.title}
        >
          <div className="flex flex-row gap-[12mm] h-full pt-[1.5mm]">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-[3.5mm]">
              {ip.leftColumn.map((sec, sIdx) => (
                <div key={`left-sec-${sIdx}`} className="mb-[2.2mm]">
                  <div className="font-bold text-[#111111] text-[10.5pt] mb-[1.5mm] leading-tight">
                    {sec.title}
                  </div>
                  {sec.subtitle && (
                    <div className="text-[9.5pt] font-bold text-[#222222] mb-[1.5mm] leading-tight">
                      {sec.subtitle}
                    </div>
                  )}
                  {sec.items && sec.items.length > 0 && (
                    <ul className="list-none p-0 m-0">
                      {sec.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start text-[9pt] leading-[1.42] text-[#222222] mb-[0.8mm]">
                          <span className="font-black mr-[2.2mm] text-[#222222] text-[9.5pt] select-none leading-[1.42]">&#8226;</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col gap-[3.5mm]">
              {ip.rightColumn.map((sec, sIdx) => (
                <div key={`right-sec-${sIdx}`} className="mb-[2.2mm]">
                  <div className="font-bold text-[#111111] text-[10.5pt] mb-[1.5mm] leading-tight">
                    {sec.title}
                  </div>
                  {sec.subtitle && (
                    <div className="text-[9.5pt] font-bold text-[#222222] mb-[1.5mm] leading-tight">
                      {sec.subtitle}
                    </div>
                  )}
                  {sec.items && sec.items.length > 0 && (
                    <ul className="list-none p-0 m-0">
                      {sec.items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start text-[9pt] leading-[1.42] text-[#222222] mb-[0.8mm]">
                          <span className="font-black mr-[2.2mm] text-[#222222] text-[9.5pt] select-none leading-[1.42]">&#8226;</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DocumentPage>
      ))}

      {/* 2. Quotation Items Pages */}
      {itemsPages.map((qp) => {
        let emptyRowsCount = 0;
        if (qp.isLastItemsPage && qp.items.length < 8) {
          emptyRowsCount = 8 - qp.items.length;
        }

        return (
          <DocumentPage
            key={`item-${qp.pageNumber}`}
            pageNumber={qp.pageNumber}
            title={qp.title}
            metaRow={
              <div className="flex items-center justify-center">
                <span>Quotation Number &nbsp;:&nbsp; <strong className="font-normal">{qp.quotationNumber}</strong></span>
              </div>
            }
          >
            {qp.isFirstItemsPage && (
              <>
                <div className="flex flex-row justify-between py-[1.5mm] text-[8.8pt] leading-[1.35]">
                  <div className="flex-1">
                    <div className="font-bold text-[#111111] text-[9.5pt] mb-[1mm]">Company Name</div>
                    <div className="font-bold text-[#111111] text-[9.5pt] tracking-wide mb-[1mm]">
                      {q.company.companyName}
                    </div>
                    <div className="text-[#333333] max-w-[75mm] mb-[1mm] leading-[1.35]">
                      {q.company.address}
                    </div>
                    {q.company.gstin && (
                      <div className="text-[#444444] text-[8.5pt]">
                        <strong>GSTIN:</strong> {q.company.gstin}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pl-[14mm]">
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[22mm] font-bold text-[#111111]">Date</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{q.date || '-'}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[22mm] font-bold text-[#111111]">Client</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-bold">{q.client.name}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[22mm] font-bold text-[#111111]">Event</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{getCleanEventName(q.event)}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[22mm] font-bold text-[#111111]">Location</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{q.event?.location || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-[1.2px] bg-[#222222] my-[3.5mm]"></div>
              </>
            )}

            {/* Items Table */}
            <table className="w-full border-collapse mt-[1mm]">
              <thead>
                <tr>
                  <th className="text-[9.5pt] font-bold text-[#111111] text-left py-[2.2mm] px-[3mm] w-[44%] tracking-wide">
                    ITEM
                  </th>
                  <th className="text-[9.5pt] font-bold text-[#111111] text-center py-[2.2mm] px-[3mm] w-[20%] tracking-wide">
                    UNIT PRICE
                  </th>
                  <th className="text-[9.5pt] font-bold text-[#111111] text-center py-[2.2mm] px-[3mm] w-[14%] tracking-wide">
                    QTY
                  </th>
                  <th className="text-[9.5pt] font-bold text-[#111111] text-right py-[2.2mm] px-[3mm] w-[22%] tracking-wide">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {qp.items.map((item, idx) => {
                  const itemNum = ((qp.pageNumber - nextStartPage) * 10) + idx + 1;
                  const isAlt = idx % 2 === 0;
                  const qtyDisplay = item.quantity !== undefined && item.quantity !== null && String(item.quantity).trim() !== '' && String(item.quantity).trim() !== '1'
                    ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
                    : '-';

                  return (
                    <tr
                      key={item.id || idx}
                      className={isAlt ? 'bg-[#F7EDEE]' : 'bg-transparent'}
                    >
                      <td className="text-[9.2pt] py-[2.1mm] px-[3mm] text-[#222222] font-medium text-left">
                        {itemNum}. {item.description}
                      </td>
                      <td className="text-[9.2pt] py-[2.1mm] px-[3mm] text-[#222222] text-center">
                        {item.rate ? formatCurrency(item.rate) : '-'}
                      </td>
                      <td className="text-[9.2pt] py-[2.1mm] px-[3mm] text-[#222222] text-center">
                        {qtyDisplay}
                      </td>
                      <td className="text-[9.2pt] py-[2.1mm] px-[3mm] text-[#222222] text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  );
                })}

                {Array.from({ length: emptyRowsCount }).map((_, rIdx) => {
                  const isAlt = (qp.items.length + rIdx) % 2 === 0;
                  return (
                    <tr
                      key={`empty-${rIdx}`}
                      className={`h-[6.2mm] ${isAlt ? 'bg-[#F7EDEE]' : 'bg-transparent'}`}
                    >
                      <td className="px-[3mm]">&nbsp;</td>
                      <td className="px-[3mm]">&nbsp;</td>
                      <td className="px-[3mm]">&nbsp;</td>
                      <td className="px-[3mm]">&nbsp;</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="w-full h-[1.2px] bg-[#222222] mt-[0.5mm] mb-[2mm]"></div>

            {/* Totals Summary or Continuation note */}
            {qp.isLastItemsPage ? (
              <>
                <div className="flex justify-end pt-[2.5mm] pb-[1mm]">
                  <div className="flex flex-col gap-[1.5mm] w-[72mm]">
                    {Boolean(q.discountAmount && q.discountAmount > 0) && (
                      <>
                        <div className="flex justify-end items-center text-[9.5pt]">
                          <span className="font-semibold text-[#222222] text-right flex-1">Subtotal</span>
                          <span className="mx-[3.5mm] font-semibold">:</span>
                          <span className="w-[32mm] text-right font-semibold text-[#111111]">
                            {formatCurrency(q.subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-end items-center text-[9.5pt]">
                          <span className="font-semibold text-[#222222] text-right flex-1">
                            Discount {q.discountType === 'percentage' ? `(${q.discountValue}%)` : ''}
                          </span>
                          <span className="mx-[3.5mm] font-semibold">:</span>
                          <span className="w-[32mm] text-right font-semibold text-[#111111]">
                            - {formatCurrency(q.discountAmount)}
                          </span>
                        </div>
                      </>
                    )}
                    {Boolean(q.taxAmount && q.taxAmount > 0) && (
                      <div className="flex justify-end items-center text-[9.5pt]">
                        <span className="font-semibold text-[#222222] text-right flex-1">
                          GST / Tax ({q.taxPercentage}%)
                        </span>
                        <span className="mx-[3.5mm] font-semibold">:</span>
                        <span className="w-[32mm] text-right font-semibold text-[#111111]">
                          {formatCurrency(q.taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-end items-center text-[10.5pt] font-bold">
                      <span className="text-[#111111] text-right flex-1">
                        Grand Total
                      </span>
                      <span className="mx-[3.5mm] font-bold">:</span>
                      <span className="w-[32mm] text-right font-bold text-[#111111]">
                        {formatCurrency(q.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-[1.2px] bg-[#222222] mt-[3.5mm] mb-[2mm]"></div>
              </>
            ) : (
              <div className="mt-auto pt-[3mm] text-right italic text-[8.5pt] text-[#666666]">
                (Continued on next page...)
              </div>
            )}
          </DocumentPage>
        );
      })}

      {/* 3. Terms & Contact Pages */}
      {termsPages.map((tp) => (
        <DocumentPage
          key={`term-${tp.pageNumber}`}
          pageNumber={tp.pageNumber}
          title={tp.title}
          metaRow={
            <div className="flex items-center justify-center">
              <span>Quotation Number &nbsp;:&nbsp; <strong className="font-normal">{tp.quotationNumber}</strong></span>
            </div>
          }
        >
          {tp.isFirstTermsPage && (
            <>
              <div className="flex flex-row justify-between py-[1mm] pb-[2mm]">
                {/* Left: Contact Informations */}
                <div className="flex-1">
                  <div className="font-bold text-[#111111] text-[10.5pt] mb-[3.5mm]">
                    Contact Informations
                  </div>
                  <div className="flex flex-col gap-[2.2mm] text-[9.2pt] text-[#222222]">
                    <div className="flex items-center">
                      <span className="w-[16mm] font-semibold">Phone</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.phone || '6374672929'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[16mm] font-semibold">Email</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.email || 'kalakargroups@gmail.com'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[16mm] font-semibold">Insta</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.instagram || 'kalakargroups'}</span>
                    </div>
                    {q.company.website && (
                      <div className="flex items-center">
                        <span className="w-[16mm] font-semibold">Web</span>
                        <span className="mx-[2.5mm] font-semibold">:</span>
                        <span className="font-medium">{q.company.website}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Payment Methods */}
                <div className="flex-1 pl-[14mm]">
                  <div className="font-bold text-[#111111] text-[10.5pt] mb-[3.5mm]">
                    Payment Methods
                  </div>
                  <div className="text-[9.2pt] leading-[1.45] text-[#222222]">
                    <div className="font-bold text-[9.5pt] mb-[2mm] text-[#111111]">
                      {q.company.accountName || 'Kalakar Events'}
                    </div>
                    <div className="flex mb-[1.8mm]">
                      <span className="w-[25mm] font-semibold">ACC NO</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.accountNumber || '-'}</span>
                    </div>
                    <div className="flex mb-[1.8mm]">
                      <span className="w-[25mm] font-semibold">IFSC CODE</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.ifsc || '-'}</span>
                    </div>
                    <div className="flex mb-[1.8mm]">
                      <span className="w-[25mm] font-semibold">Branch</span>
                      <span className="mx-[2.5mm] font-semibold">:</span>
                      <span className="font-medium">{q.company.branch || '-'}</span>
                    </div>
                    {q.company.upiId && (
                      <div className="flex mb-[1.8mm]">
                        <span className="w-[25mm] font-semibold">UPI ID</span>
                        <span className="mx-[2.5mm] font-semibold">:</span>
                        <span className="font-medium">{q.company.upiId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full h-[1.2px] bg-[#222222] my-[4mm]"></div>
            </>
          )}

          {/* Terms & Conditions */}
          <div className="mt-[1mm]">
            <div className="font-bold text-[#111111] text-[10.5pt] mb-[3.5mm]">
              Terms & Conditions
            </div>
            <ul className="list-none p-0 m-0">
              {tp.terms.map((t, idx) => (
                <li key={idx} className="flex items-start text-[8.8pt] leading-[1.45] text-[#222222] mb-[2mm]">
                  <span className="font-black mr-[2.5mm] text-[#222222] text-[9pt] select-none leading-[1.45]">&#8226;</span>
                  <span className="flex-1">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </DocumentPage>
      ))}
    </div>
  );
};
