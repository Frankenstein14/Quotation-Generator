import React from 'react';
import { Invoice } from '../../types';
import { DocumentPage } from './DocumentPage';
import { paginateInvoice } from '../../services/pagination';

interface InvoiceDocumentProps {
  invoice: Invoice;
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

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice: inv }) => {
  const pages = paginateInvoice(inv.items || [], inv.terms || [], inv.invoiceNumber);

  return (
    <div className="flex flex-col gap-8 items-center py-4 print:p-0 print:gap-0">
      {pages.map((ip) => {
        let emptyRowsCount = 0;
        if (ip.isLastPage && ip.items.length < 6) {
          emptyRowsCount = 6 - ip.items.length;
        }

        return (
          <DocumentPage
            key={`inv-${ip.pageNumber}`}
            pageNumber={ip.pageNumber}
            title={ip.title}
            metaRow={
              <div className="flex items-center justify-center">
                <span>Invoice Number &nbsp;:&nbsp; <strong className="font-normal">{ip.invoiceNumber}</strong></span>
              </div>
            }
          >
            {ip.isFirstPage && (
              <>
                <div className="flex flex-row justify-between py-[1.5mm] text-[8.8pt] leading-[1.35]">
                  <div className="flex-1">
                    <div className="font-bold text-[#111111] text-[9.5pt] mb-[1mm]">Billed By</div>
                    <div className="font-bold text-[#111111] text-[9.5pt] tracking-wide mb-[1mm]">
                      {inv.company.companyName}
                    </div>
                    <div className="text-[#333333] max-w-[75mm] mb-[1mm] leading-[1.35]">
                      {inv.company.address}
                    </div>
                    {inv.company.gstin && (
                      <div className="text-[#444444] text-[8.5pt]">
                        <strong>GSTIN:</strong> {inv.company.gstin}
                      </div>
                    )}
                    <div className="text-[#444444] text-[8.5pt]" style={{ marginTop: '1mm' }}>
                      Phone: {inv.company.phone}
                    </div>
                  </div>

                  <div className="flex-1 pl-[14mm]">
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[24mm] font-bold text-[#111111]">Invoice Date</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{inv.date || '-'}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[24mm] font-bold text-[#111111]">Due Date</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{inv.dueDate || inv.date || '-'}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[24mm] font-bold text-[#111111]">Billed To</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-bold">{inv.client.name}</span>
                    </div>
                    {inv.client.phone && (
                      <div className="flex mb-[1.2mm] text-[9.2pt]">
                        <span className="w-[24mm] font-bold text-[#111111]">Phone</span>
                        <span className="mr-[3mm] font-bold">:</span>
                        <span className="text-[#222222] font-medium">{inv.client.phone}</span>
                      </div>
                    )}
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[24mm] font-bold text-[#111111]">Event</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{getCleanEventName(inv.event)}</span>
                    </div>
                    <div className="flex mb-[1.2mm] text-[9.2pt]">
                      <span className="w-[24mm] font-bold text-[#111111]">Location</span>
                      <span className="mr-[3mm] font-bold">:</span>
                      <span className="text-[#222222] font-medium">{inv.event?.location || '-'}</span>
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
                ${ip.items.map((item, idx) => {
                  const itemNum = ((ip.pageNumber - 1) * 10) + idx + 1;
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
                  const isAlt = (ip.items.length + rIdx) % 2 === 0;
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

            {/* Totals Summary */}
            {ip.isLastPage ? (
              <>
                <div className="flex justify-end pt-[2.5mm] pb-[1mm]">
                  <div className="flex flex-col gap-[1.5mm] w-[72mm]">
                    <div className="flex justify-end items-center text-[9.5pt]">
                      <span className="font-semibold text-[#222222] text-right flex-1">Subtotal</span>
                      <span className="mx-[3.5mm] font-semibold">:</span>
                      <span className="w-[32mm] text-right font-semibold text-[#111111]">
                        {formatCurrency(inv.subtotal)}
                      </span>
                    </div>
                    {Boolean(inv.discountAmount && inv.discountAmount > 0) && (
                      <div className="flex justify-end items-center text-[9.5pt]">
                        <span className="font-semibold text-[#222222] text-right flex-1">
                          Discount {inv.discountType === 'percentage' ? `(${inv.discountValue}%)` : ''}
                        </span>
                        <span className="mx-[3.5mm] font-semibold">:</span>
                        <span className="w-[32mm] text-right font-semibold text-[#111111]">
                          - {formatCurrency(inv.discountAmount)}
                        </span>
                      </div>
                    )}
                    {Boolean(inv.taxAmount && inv.taxAmount > 0) && (
                      <div className="flex justify-end items-center text-[9.5pt]">
                        <span className="font-semibold text-[#222222] text-right flex-1">
                          GST / Tax ({inv.taxPercentage}%)
                        </span>
                        <span className="mx-[3.5mm] font-semibold">:</span>
                        <span className="w-[32mm] text-right font-semibold text-[#111111]">
                          {formatCurrency(inv.taxAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-end items-center text-[10.5pt] font-bold">
                      <span className="text-[#111111] text-right flex-1">
                        Grand Total
                      </span>
                      <span className="mx-[3.5mm] font-bold">:</span>
                      <span className="w-[32mm] text-right font-bold text-[#111111]">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </div>
                    {inv.amountPaid !== undefined && inv.amountPaid > 0 && (
                      <>
                        <div className="flex justify-end items-center text-[9pt] mt-[1mm]">
                          <span className="font-semibold text-[#222222] text-right flex-1">Amount Paid</span>
                          <span className="mx-[3.5mm] font-semibold">:</span>
                          <span className="w-[32mm] text-right font-semibold text-emerald-700">
                            {formatCurrency(inv.amountPaid)}
                          </span>
                        </div>
                        <div className="flex justify-end items-center text-[9.5pt] font-bold">
                          <span className="text-[#111111] text-right flex-1">Balance Due</span>
                          <span className="mx-[3.5mm] font-bold">:</span>
                          <span className="w-[32mm] text-right font-bold text-red-700">
                            {formatCurrency(inv.balanceDue ?? (inv.grandTotal - inv.amountPaid))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full h-[1.2px] bg-[#222222] mt-[3.5mm] mb-[2mm]"></div>

                {/* Bottom row: Payment info + Signatory */}
                <div className="flex flex-row justify-between mt-[3mm] pt-[1mm]">
                  <div className="flex-1">
                    <div className="font-bold text-[#111111] text-[10.5pt] mb-[2.5mm]">
                      Payment Information
                    </div>
                    <div className="text-[9pt] leading-[1.45] text-[#222222]">
                      <div className="font-bold text-[9.5pt] mb-[1.5mm] text-[#111111]">
                        {inv.paymentDetails?.accountName || inv.company.accountName}
                      </div>
                      <div className="flex mb-[1mm]">
                        <span className="w-[25mm] font-semibold">ACC NO</span>
                        <span className="mx-[2.5mm] font-semibold">:</span>
                        <span className="font-medium">{inv.paymentDetails?.accountNumber || inv.company.accountNumber}</span>
                      </div>
                      <div className="flex mb-[1mm]">
                        <span className="w-[25mm] font-semibold">IFSC CODE</span>
                        <span className="mx-[2.5mm] font-semibold">:</span>
                        <span className="font-medium">{inv.paymentDetails?.ifsc || inv.company.ifsc}</span>
                      </div>
                      <div className="flex mb-[1mm]">
                        <span className="w-[25mm] font-semibold">Branch</span>
                        <span className="mx-[2.5mm] font-semibold">:</span>
                        <span className="font-medium">{inv.paymentDetails?.branch || inv.company.branch}</span>
                      </div>
                      {(inv.paymentDetails?.upiId || inv.company.upiId) && (
                        <div className="flex mb-[1mm]">
                          <span className="w-[25mm] font-semibold">UPI ID</span>
                          <span className="mx-[2.5mm] font-semibold">:</span>
                          <span className="font-medium">{inv.paymentDetails?.upiId || inv.company.upiId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex justify-end items-end">
                    <div className="text-center w-[55mm]">
                      <div className="text-[8.5pt] font-semibold text-[#444444] mb-[12mm]">
                        For {inv.company.companyName}
                      </div>
                      <div className="h-[12mm]"></div>
                      <div className="border-t border-[#333333] pt-[1.5mm] text-[8.5pt] font-semibold text-[#222222]">
                        {inv.signatureText || 'Authorized Signatory'}
                      </div>
                    </div>
                  </div>
                </div>

                {ip.terms && ip.terms.length > 0 && (
                  <>
                    <div className="w-full h-[1.2px] bg-[#222222] my-[4mm]"></div>
                    <div className="mt-[2mm]">
                      <div className="font-bold text-[#111111] text-[10pt] mb-[2mm]">
                        Terms & Conditions
                      </div>
                      <ul className="list-none p-0 m-0">
                        {ip.terms.slice(0, 4).map((t, idx) => (
                          <li key={idx} className="flex items-start text-[8.5pt] leading-[1.4] text-[#222222] mb-[1.5mm]">
                            <span className="font-black mr-[2.5mm] text-[#222222] text-[8.5pt] select-none">&#8226;</span>
                            <span className="flex-1">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="mt-auto pt-[3mm] text-right italic text-[8.5pt] text-[#666666]">
                (Continued on next page...)
              </div>
            )}
          </DocumentPage>
        );
      })}
    </div>
  );
};
