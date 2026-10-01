import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Quotation, Invoice } from '../../shared/types.js';
import { getBrowserExecutablePath, ASSETS_DIR, DEFAULT_COMPANY_SETTINGS } from '../config.js';
import {
  paginateInclusions,
  paginateQuotationItems,
  paginateTerms,
  paginateInvoice
} from './pagination.js';

// Preload asset base64 for embedding directly
let bgBase64 = '';

try {
  const bgPath = path.join(ASSETS_DIR, 'page_bg_clean.png');
  if (fs.existsSync(bgPath)) {
    bgBase64 = `data:image/png;base64,${fs.readFileSync(bgPath).toString('base64')}`;
  }
} catch (e) {
  console.warn('Error preloading PDF assets:', e);
}

function formatCurrency(val?: number | string): string {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  return 'Rs. ' + num.toLocaleString('en-IN');
}

function getCleanEventName(event?: { name?: string; type?: string; location?: string }): string {
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

export function generateQuotationHtml(q: Quotation): string {
  const company = q.company || DEFAULT_COMPANY_SETTINGS;
  const client = q.client || { name: '', phone: '', email: '', address: '' };
  const event = q.event || { name: '', type: 'Event', date: '', location: '', guestCount: '' };

  // Page distribution:
  // Step 1: Inclusions start on Page 1 (per explicit user instruction)
  const inclusionsPages = paginateInclusions(q.inclusions || [], 1);
  const nextStartPage = inclusionsPages.length + 1;

  // Step 2: Quotation Items follow Inclusions
  const itemsPages = paginateQuotationItems(q.items || [], q.quotationNumber, nextStartPage);
  const termsStartPage = nextStartPage + itemsPages.length;

  // Step 3: Terms & Contact/Payment follow Items
  const termsPages = paginateTerms(q.terms || [], q.quotationNumber, termsStartPage);

  let pagesHtml = '';

  // -------------------------------------------------------------
  // Render Inclusions Pages (Page 1+)
  // -------------------------------------------------------------
  for (const ip of inclusionsPages) {
    pagesHtml += `
      <div class="a4-page">
        <div class="page-inner">
          <div class="page-header inclusions-header">
            <div class="header-title">${ip.title}</div>
          </div>
          <div class="divider header-divider"></div>

          <div class="page-content inclusions-content">
            <div class="inclusions-layout">
              <div class="inclusion-column">
                ${ip.leftColumn.map(sec => `
                  <div class="inc-section">
                    <div class="inc-heading">${sec.title}</div>
                    ${sec.subtitle ? `<div class="inc-subtitle">${sec.subtitle}</div>` : ''}
                    ${sec.items && sec.items.length > 0 ? `
                      <ul class="inc-list">
                        ${sec.items.map(it => `
                          <li><span class="bullet-dot">&#8226;</span> <span class="bullet-text">${it}</span></li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>

              <div class="inclusion-column">
                ${ip.rightColumn.map(sec => `
                  <div class="inc-section">
                    <div class="inc-heading">${sec.title}</div>
                    ${sec.subtitle ? `<div class="inc-subtitle">${sec.subtitle}</div>` : ''}
                    ${sec.items && sec.items.length > 0 ? `
                      <ul class="inc-list">
                        ${sec.items.map(it => `
                          <li><span class="bullet-dot">&#8226;</span> <span class="bullet-text">${it}</span></li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="page-footer">
            <div class="footer-page-num">${ip.pageNumber}</div>
            <div class="footer-note">If you have any questions concerning this quotation, please contact sales team</div>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Render Quotation Items Pages
  // -------------------------------------------------------------
  for (const qp of itemsPages) {
    // Generate empty filler rows to match Canva template structure if few items on final page
    let emptyRowsHtml = '';
    if (qp.isLastItemsPage && qp.items.length < 8) {
      const needed = 8 - qp.items.length;
      for (let r = 0; r < needed; r++) {
        const isAlt = (qp.items.length + r) % 2 === 0;
        emptyRowsHtml += `
          <tr class="empty-row ${isAlt ? 'alt-row' : ''}">
            <td class="td-item">&nbsp;</td>
            <td class="td-price">&nbsp;</td>
            <td class="td-qty">&nbsp;</td>
            <td class="td-total">&nbsp;</td>
          </tr>
        `;
      }
    }

    pagesHtml += `
      <div class="a4-page">
        <div class="page-inner">
          <div class="page-header">
            <div class="header-title">${qp.title}</div>
            <div class="header-meta">Quotation Number &nbsp;:&nbsp; <span>${qp.quotationNumber}</span></div>
          </div>
          <div class="divider header-divider"></div>

          <div class="page-content">
            ${qp.isFirstItemsPage ? `
              <div class="party-info-row">
                <div class="party-col">
                  <div class="meta-label">Company Name</div>
                  <div class="company-name-val">${company.companyName}</div>
                  <div class="company-address">${company.address}</div>
                  ${company.gstin ? `<div class="company-detail"><strong>GSTIN:</strong> ${company.gstin}</div>` : ''}
                </div>
                <div class="party-col party-right-col">
                  <div class="meta-line"><span class="m-label">Date</span><span class="m-colon">:</span><span class="m-val">${q.date || '-'}</span></div>
                  <div class="meta-line"><span class="m-label">Client</span><span class="m-colon">:</span><span class="m-val"><strong>${client.name}</strong></span></div>
                  <div class="meta-line"><span class="m-label">Event</span><span class="m-colon">:</span><span class="m-val">${getCleanEventName(event)}</span></div>
                  <div class="meta-line"><span class="m-label">Location</span><span class="m-colon">:</span><span class="m-val">${event.location || '-'}</span></div>
                </div>
              </div>
              <div class="divider section-divider"></div>
            ` : ''}

            <table class="items-table">
              <thead>
                <tr>
                  <th class="th-item">ITEM</th>
                  <th class="th-price">UNIT PRICE</th>
                  <th class="th-qty">QTY</th>
                  <th class="th-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${qp.items.map((it, idx) => {
                  const itemNum = ((qp.pageNumber - nextStartPage) * 10) + idx + 1;
                  const isAlt = idx % 2 === 0;
                  const qtyDisplay = it.quantity !== undefined && it.quantity !== null && String(it.quantity).trim() !== '' && String(it.quantity).trim() !== '1'
                    ? `${it.quantity}${it.unit ? ` ${it.unit}` : ''}`
                    : '-';
                  return `
                    <tr class="${isAlt ? 'alt-row' : ''}">
                      <td class="td-item">${itemNum}. ${it.description}</td>
                      <td class="td-price">${it.rate ? formatCurrency(it.rate) : '-'}</td>
                      <td class="td-qty">${qtyDisplay}</td>
                      <td class="td-total">${formatCurrency(it.amount)}</td>
                    </tr>
                  `;
                }).join('')}
                ${emptyRowsHtml}
              </tbody>
            </table>
            <div class="divider table-divider"></div>

            ${qp.isLastItemsPage ? `
              <div class="totals-container">
                <div class="totals-block">
                  ${(q.discountAmount && q.discountAmount > 0) ? `
                    <div class="totals-row">
                      <span class="tot-label">Subtotal</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val">${formatCurrency(q.subtotal)}</span>
                    </div>
                    <div class="totals-row">
                      <span class="tot-label">Discount ${q.discountType === 'percentage' ? `(${q.discountValue}%)` : ''}</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val">- ${formatCurrency(q.discountAmount)}</span>
                    </div>
                  ` : ''}
                  ${(q.taxAmount && q.taxAmount > 0) ? `
                    <div class="totals-row">
                      <span class="tot-label">GST / Tax (${q.taxPercentage}%)</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val">${formatCurrency(q.taxAmount)}</span>
                    </div>
                  ` : ''}
                  <div class="totals-row grand-total-row">
                    <span class="tot-label grand-label">Grand Total</span>
                    <span class="tot-colon">:</span>
                    <span class="tot-val grand-val">${formatCurrency(q.grandTotal)}</span>
                  </div>
                </div>
              </div>
              <div class="divider totals-divider"></div>
            ` : `
              <div class="cont-note">(Continued on next page...)</div>
            `}
          </div>

          <div class="page-footer">
            <div class="footer-page-num">${qp.pageNumber}</div>
            <div class="footer-note">If you have any questions concerning this quotation, please contact sales team</div>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Render Terms & Contact Pages
  // -------------------------------------------------------------
  for (const tp of termsPages) {
    pagesHtml += `
      <div class="a4-page">
        <div class="page-inner">
          <div class="page-header">
            <div class="header-title">${tp.title}</div>
            <div class="header-meta">Quotation Number &nbsp;:&nbsp; <span>${tp.quotationNumber}</span></div>
          </div>
          <div class="divider header-divider"></div>

          <div class="page-content">
            ${tp.isFirstTermsPage ? `
              <div class="contact-payment-grid">
                <div class="cp-col">
                  <div class="cp-heading">Contact Informations</div>
                  <div class="cp-contact-items">
                    <div class="cp-item">
                      <span class="cp-label">Phone</span>
                      <span class="cp-colon">:</span>
                      <span class="cp-val">${company.phone || '6374672929'}</span>
                    </div>
                    <div class="cp-item">
                      <span class="cp-label">Email</span>
                      <span class="cp-colon">:</span>
                      <span class="cp-val">${company.email || 'kalakargroups@gmail.com'}</span>
                    </div>
                    <div class="cp-item">
                      <span class="cp-label">Insta</span>
                      <span class="cp-colon">:</span>
                      <span class="cp-val">${company.instagram || 'kalakargroups'}</span>
                    </div>
                    ${company.website ? `
                      <div class="cp-item">
                        <span class="cp-label">Web</span>
                        <span class="cp-colon">:</span>
                        <span class="cp-val">${company.website}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="cp-col cp-right-col">
                  <div class="cp-heading">Payment Methods</div>
                  <div class="bank-acc-name">${company.accountName || 'Kalakar Events'}</div>
                  <div class="bank-line"><span class="b-lbl">ACC NO</span><span class="b-cln">:</span><span class="b-val">${company.accountNumber || '-'}</span></div>
                  <div class="bank-line"><span class="b-lbl">IFSC CODE</span><span class="b-cln">:</span><span class="b-val">${company.ifsc || '-'}</span></div>
                  <div class="bank-line"><span class="b-lbl">Branch</span><span class="b-cln">:</span><span class="b-val">${company.branch || '-'}</span></div>
                  ${company.upiId ? `<div class="bank-line"><span class="b-lbl">UPI ID</span><span class="b-cln">:</span><span class="b-val">${company.upiId}</span></div>` : ''}
                </div>
              </div>
              <div class="divider section-divider" style="margin: 4mm 0 5mm 0;"></div>
            ` : ''}

            <div class="terms-section">
              <div class="terms-heading">Terms & Conditions</div>
              <ul class="terms-list">
                ${tp.terms.map(t => `
                  <li><span class="term-bullet">&#8226;</span> <span class="term-text">${t}</span></li>
                `).join('')}
              </ul>
            </div>
          </div>

          <div class="page-footer">
            <div class="footer-page-num">${tp.pageNumber}</div>
            <div class="footer-note">If you have any questions concerning this quotation, please contact sales team</div>
          </div>
        </div>
      </div>
    `;
  }

  return wrapHtmlDocument(pagesHtml, q.quotationNumber);
}

export function generateInvoiceHtml(inv: Invoice): string {
  const company = inv.company || DEFAULT_COMPANY_SETTINGS;
  const client = inv.client || { name: '', phone: '', email: '', address: '' };
  const event = inv.event || { name: '', type: 'Event', date: '', location: '', guestCount: '' };
  const paymentDetails = inv.paymentDetails || {
    accountName: company.accountName,
    bankName: company.bankName,
    accountNumber: company.accountNumber,
    ifsc: company.ifsc,
    branch: company.branch,
    upiId: company.upiId
  };

  const pages = paginateInvoice(inv.items || [], inv.terms || [], inv.invoiceNumber);

  let pagesHtml = '';

  for (const ip of pages) {
    let emptyRowsHtml = '';
    if (ip.isLastPage && ip.items.length < 6) {
      const needed = 6 - ip.items.length;
      for (let r = 0; r < needed; r++) {
        const isAlt = (ip.items.length + r) % 2 === 0;
        emptyRowsHtml += `
          <tr class="empty-row ${isAlt ? 'alt-row' : ''}">
            <td class="td-item">&nbsp;</td>
            <td class="td-price">&nbsp;</td>
            <td class="td-qty">&nbsp;</td>
            <td class="td-total">&nbsp;</td>
          </tr>
        `;
      }
    }

    pagesHtml += `
      <div class="a4-page">
        <div class="page-inner">
          <div class="page-header">
            <div class="header-title">${ip.title}</div>
            <div class="header-meta">Invoice Number &nbsp;:&nbsp; <span>${ip.invoiceNumber}</span></div>
          </div>
          <div class="divider header-divider"></div>

          <div class="page-content">
            ${ip.isFirstPage ? `
              <div class="party-info-row">
                <div class="party-col">
                  <div class="meta-label">Billed By</div>
                  <div class="company-name-val">${company.companyName}</div>
                  <div class="company-address">${company.address}</div>
                  ${company.gstin ? `<div class="company-detail"><strong>GSTIN:</strong> ${company.gstin}</div>` : ''}
                  <div class="company-detail" style="margin-top: 1mm;">Phone: ${company.phone}</div>
                </div>
                <div class="party-col party-right-col">
                  <div class="meta-line"><span class="m-label">Invoice Date</span><span class="m-colon">:</span><span class="m-val">${inv.date}</span></div>
                  <div class="meta-line"><span class="m-label">Due Date</span><span class="m-colon">:</span><span class="m-val">${inv.dueDate || inv.date}</span></div>
                  <div class="meta-line"><span class="m-label">Billed To</span><span class="m-colon">:</span><span class="m-val"><strong>${client.name}</strong></span></div>
                  ${client.phone ? `<div class="meta-line"><span class="m-label">Phone</span><span class="m-colon">:</span><span class="m-val">${client.phone}</span></div>` : ''}
                  <div class="meta-line"><span class="m-label">Event</span><span class="m-colon">:</span><span class="m-val">${getCleanEventName(event)}</span></div>
                  <div class="meta-line"><span class="m-label">Location</span><span class="m-colon">:</span><span class="m-val">${event.location || '-'}</span></div>
                </div>
              </div>
              <div class="divider section-divider"></div>
            ` : ''}

            <table class="items-table">
              <thead>
                <tr>
                  <th class="th-item">ITEM</th>
                  <th class="th-price">UNIT PRICE</th>
                  <th class="th-qty">QTY</th>
                  <th class="th-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${ip.items.map((it, idx) => {
                  const itemNum = ((ip.pageNumber - 1) * 10) + idx + 1;
                  const isAlt = idx % 2 === 0;
                  const qtyDisplay = it.quantity !== undefined && it.quantity !== null && String(it.quantity).trim() !== '' && String(it.quantity).trim() !== '1'
                    ? `${it.quantity}${it.unit ? ` ${it.unit}` : ''}`
                    : '-';
                  return `
                    <tr class="${isAlt ? 'alt-row' : ''}">
                      <td class="td-item">${itemNum}. ${it.description}</td>
                      <td class="td-price">${it.rate ? formatCurrency(it.rate) : '-'}</td>
                      <td class="td-qty">${qtyDisplay}</td>
                      <td class="td-total">${formatCurrency(it.amount)}</td>
                    </tr>
                  `;
                }).join('')}
                ${emptyRowsHtml}
              </tbody>
            </table>
            <div class="divider table-divider"></div>

            ${ip.isLastPage ? `
              <div class="totals-container">
                <div class="totals-block">
                  <div class="totals-row">
                    <span class="tot-label">Subtotal</span>
                    <span class="tot-colon">:</span>
                    <span class="tot-val">${formatCurrency(inv.subtotal)}</span>
                  </div>
                  ${(inv.discountAmount && inv.discountAmount > 0) ? `
                    <div class="totals-row">
                      <span class="tot-label">Discount ${inv.discountType === 'percentage' ? `(${inv.discountValue}%)` : ''}</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val">- ${formatCurrency(inv.discountAmount)}</span>
                    </div>
                  ` : ''}
                  ${(inv.taxAmount && inv.taxAmount > 0) ? `
                    <div class="totals-row">
                      <span class="tot-label">GST / Tax (${inv.taxPercentage}%)</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val">${formatCurrency(inv.taxAmount)}</span>
                    </div>
                  ` : ''}
                  <div class="totals-row grand-total-row">
                    <span class="tot-label grand-label">Grand Total</span>
                    <span class="tot-colon">:</span>
                    <span class="tot-val grand-val">${formatCurrency(inv.grandTotal)}</span>
                  </div>
                  ${inv.amountPaid !== undefined && inv.amountPaid > 0 ? `
                    <div class="totals-row" style="margin-top: 1mm; font-size: 9pt;">
                      <span class="tot-label">Amount Paid</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val" style="color: #2e7d32;">${formatCurrency(inv.amountPaid)}</span>
                    </div>
                    <div class="totals-row" style="font-size: 9.5pt; font-weight: 700;">
                      <span class="tot-label">Balance Due</span>
                      <span class="tot-colon">:</span>
                      <span class="tot-val" style="color: #b71c1c;">${formatCurrency(inv.balanceDue ?? (inv.grandTotal - inv.amountPaid))}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              <div class="divider totals-divider"></div>

              <div class="invoice-bottom-grid">
                <div class="inv-bottom-col">
                  <div class="cp-heading">Payment Information</div>
                  <div class="cp-bank-details">
                    <div class="bank-acc-name">${paymentDetails.accountName || company.accountName}</div>
                    <div class="bank-line"><span class="b-lbl">ACC NO</span><span class="b-cln">:</span><span class="b-val">${paymentDetails.accountNumber || company.accountNumber}</span></div>
                    <div class="bank-line"><span class="b-lbl">IFSC CODE</span><span class="b-cln">:</span><span class="b-val">${paymentDetails.ifsc || company.ifsc}</span></div>
                    <div class="bank-line"><span class="b-lbl">Branch</span><span class="b-cln">:</span><span class="b-val">${paymentDetails.branch || company.branch}</span></div>
                    ${paymentDetails.upiId ? `<div class="bank-line"><span class="b-lbl">UPI ID</span><span class="b-cln">:</span><span class="b-val">${paymentDetails.upiId}</span></div>` : ''}
                  </div>
                </div>
                <div class="inv-bottom-col sign-col">
                  <div class="signature-box">
                    <div class="for-company">For ${company.companyName}</div>
                    <div class="sign-space"></div>
                    <div class="sign-line">${inv.signatureText || 'Authorized Signatory'}</div>
                  </div>
                </div>
              </div>

              ${ip.terms && ip.terms.length > 0 ? `
                <div class="divider section-divider" style="margin: 4mm 0 3mm 0;"></div>
                <div class="terms-section inv-terms">
                  <div class="terms-heading">Terms & Conditions</div>
                  <ul class="terms-list">
                    ${ip.terms.slice(0, 4).map(t => `
                      <li><span class="term-bullet">&#8226;</span> <span class="term-text">${t}</span></li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            ` : `
              <div class="cont-note">(Continued on next page...)</div>
            `}
          </div>

          <div class="page-footer">
            <div class="footer-page-num">${ip.pageNumber}</div>
            <div class="footer-note">If you have any questions concerning this quotation, please contact sales team</div>
          </div>
        </div>
      </div>
    `;
  }

  return wrapHtmlDocument(pagesHtml, inv.invoiceNumber);
}

function wrapHtmlDocument(pagesHtml: string, docTitle: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${docTitle} - KALAKAR EVENTS</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: #2b2b2b;
          font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif;
          color: #222222;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .a4-page {
          width: 210mm;
          height: 297mm;
          min-width: 210mm;
          min-height: 297mm;
          max-width: 210mm;
          max-height: 297mm;
          position: relative;
          background-image: url('${bgBase64}');
          background-size: 100% 100%;
          background-repeat: no-repeat;
          page-break-after: always;
          break-after: page;
          overflow: hidden;
          margin: 0 auto;
        }

        .page-inner {
          position: absolute;
          top: 16mm;
          left: 17mm;
          right: 17mm;
          bottom: 12mm;
          display: flex;
          flex-direction: column;
        }

        /* Header Area: 38mm height vertically centers title with logo (which ends at 54.2mm) */
        .page-header {
          text-align: center;
          height: 38mm;
          min-height: 38mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0;
        }

        .inclusions-header {
          height: 38mm;
          min-height: 38mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0;
        }

        .header-title {
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 26pt;
          font-weight: 700;
          color: #111111;
          letter-spacing: 1.5px;
          text-align: center;
          line-height: 1;
        }

        .header-meta {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 9.8pt;
          font-weight: 600;
          color: #222222;
          margin-top: 3.2mm;
          text-align: center;
          letter-spacing: 0.2px;
        }

        .header-meta span {
          font-weight: 500;
        }

        /* Divider Line */
        .divider {
          width: 100%;
          height: 1.2px;
          background-color: #222222;
          margin: 3.5mm 0;
        }

        /* Header divider placed at y=58mm, cleanly below bottom of logo at 54.2mm */
        .header-divider {
          margin-top: 4mm;
          margin-bottom: 4mm;
        }

        .section-divider {
          margin: 3.5mm 0 4mm 0;
        }

        .table-divider {
          margin: 0.5mm 0 2mm 0;
        }

        .totals-divider {
          margin: 3.5mm 0 2mm 0;
        }

        /* Page Content Area */
        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .inclusions-content {
          padding-top: 1.5mm;
        }

        /* Inclusions 2-Column Layout */
        .inclusions-layout {
          display: flex;
          flex-direction: row;
          gap: 12mm;
          height: 100%;
        }

        .inclusion-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3.5mm;
        }

        .inc-section {
          margin-bottom: 2.2mm;
        }

        .inc-heading {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 10.5pt;
          font-weight: 700;
          color: #111111;
          margin-bottom: 1.5mm;
          line-height: 1.25;
        }

        .inc-subtitle {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 9.5pt;
          font-weight: 700;
          color: #222222;
          margin-bottom: 1.5mm;
          line-height: 1.25;
        }

        .inc-list {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }

        .inc-list li {
          display: flex;
          align-items: flex-start;
          font-size: 9pt;
          line-height: 1.42;
          color: #222222;
          margin-bottom: 0.8mm;
        }

        .bullet-dot {
          font-weight: 900;
          margin-right: 2.2mm;
          color: #222222;
          font-size: 9.5pt;
          line-height: 1.42;
        }

        .bullet-text {
          flex: 1;
        }

        /* Metadata Row */
        .party-info-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: 1.5mm 0 2mm 0;
          font-size: 8.8pt;
          line-height: 1.35;
        }

        .party-col {
          flex: 1;
        }

        .party-right-col {
          flex: 1;
          padding-left: 14mm;
        }

        .meta-label {
          font-weight: 700;
          color: #111111;
          margin-bottom: 1mm;
          font-size: 9.5pt;
        }

        .company-name-val {
          font-weight: 700;
          color: #111111;
          font-size: 9.5pt;
          letter-spacing: 0.3px;
          margin-bottom: 1mm;
        }

        .company-address {
          color: #333333;
          max-width: 75mm;
          line-height: 1.35;
          margin-bottom: 1mm;
        }

        .company-detail {
          color: #444444;
          font-size: 8.5pt;
        }

        .meta-line {
          display: flex;
          margin-bottom: 1.2mm;
          font-size: 9.2pt;
        }

        .m-label {
          width: 22mm;
          font-weight: 700;
          color: #111111;
        }

        .m-colon {
          margin-right: 3mm;
          font-weight: 700;
        }

        .m-val {
          color: #222222;
          font-weight: 500;
        }

        /* Items Table */
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1mm;
        }

        .items-table thead th {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 9.5pt;
          font-weight: 700;
          color: #111111;
          padding: 2.2mm 3mm;
          letter-spacing: 0.4px;
        }

        .th-item { width: 44%; text-align: left; }
        .th-price { width: 20%; text-align: center; }
        .th-qty { width: 14%; text-align: center; }
        .th-total { width: 22%; text-align: right; }

        .items-table tbody td {
          font-size: 9.2pt;
          padding: 2.1mm 3mm;
          color: #222222;
        }

        .td-item { font-weight: 500; text-align: left; }
        .td-price { text-align: center; }
        .td-qty { text-align: center; }
        .td-total { text-align: right; font-weight: 500; }

        .alt-row {
          background-color: #F7EDEE; /* Soft rose blush from Canva reference */
        }

        .empty-row td {
          height: 6.2mm;
          padding: 0 3mm;
        }

        /* Totals Block */
        .totals-container {
          display: flex;
          justify-content: flex-end;
          padding: 2.5mm 0 1mm 0;
        }

        .totals-block {
          display: flex;
          flex-direction: column;
          gap: 1.5mm;
          width: 72mm;
        }

        .totals-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          font-size: 9.5pt;
        }

        .tot-label {
          font-weight: 600;
          color: #222222;
          text-align: right;
          flex: 1;
        }

        .tot-colon {
          margin: 0 3.5mm;
          font-weight: 600;
        }

        .tot-val {
          width: 32mm;
          text-align: right;
          color: #111111;
          font-weight: 600;
        }

        .grand-total-row {
          font-size: 10.5pt;
          font-weight: 700;
        }

        .grand-label {
          font-weight: 700;
          color: #111111;
        }

        .grand-val {
          font-weight: 700;
          color: #111111;
        }

        /* Contact & Payment Grid */
        .contact-payment-grid {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: 1mm 0 2mm 0;
        }

        .cp-col {
          flex: 1;
        }

        .cp-right-col {
          flex: 1;
          padding-left: 14mm;
        }

        .cp-heading {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 10.5pt;
          font-weight: 700;
          color: #111111;
          margin-bottom: 3.5mm;
        }

        .cp-contact-items {
          display: flex;
          flex-direction: column;
          gap: 2.2mm;
        }

        .cp-item {
          display: flex;
          align-items: center;
          font-size: 9.2pt;
          color: #222222;
        }

        .cp-label {
          width: 16mm;
          font-weight: 600;
          color: #222222;
        }

        .cp-colon {
          margin: 0 2.5mm;
          font-weight: 600;
        }

        .cp-val {
          font-weight: 500;
          color: #222222;
        }

        .bank-acc-name {
          font-weight: 700;
          margin-bottom: 2mm;
          font-size: 9.5pt;
          color: #111111;
        }

        .bank-line {
          display: flex;
          margin-bottom: 1.8mm;
          font-size: 9.2pt;
        }

        .b-lbl {
          width: 25mm;
          font-weight: 600;
          color: #222222;
        }

        .b-cln {
          margin: 0 2.5mm;
          font-weight: 600;
        }

        .b-val {
          font-weight: 500;
          color: #222222;
        }

        /* Terms & Conditions */
        .terms-section {
          margin-top: 1mm;
        }

        .terms-heading {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 10.5pt;
          font-weight: 700;
          color: #111111;
          margin-bottom: 3.5mm;
        }

        .terms-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .terms-list li {
          display: flex;
          align-items: flex-start;
          font-size: 8.8pt;
          line-height: 1.45;
          color: #222222;
          margin-bottom: 2mm;
        }

        .term-bullet {
          font-weight: 900;
          margin-right: 2.5mm;
          color: #222222;
          font-size: 9pt;
          line-height: 1.45;
        }

        .term-text {
          flex: 1;
        }

        /* Invoice Specifics */
        .invoice-bottom-grid {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-top: 3mm;
          padding-top: 1mm;
        }

        .inv-bottom-col {
          flex: 1;
        }

        .sign-col {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }

        .signature-box {
          text-align: center;
          width: 55mm;
        }

        .for-company {
          font-size: 8.5pt;
          font-weight: 600;
          color: #444444;
          margin-bottom: 12mm;
        }

        .sign-space {
          height: 12mm;
        }

        .sign-line {
          border-top: 1px solid #333333;
          padding-top: 1.5mm;
          font-size: 8.5pt;
          font-weight: 600;
          color: #222222;
        }

        /* Page Footer */
        .page-footer {
          margin-top: auto;
          padding-top: 2mm;
          text-align: center;
        }

        .footer-page-num {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 10pt;
          font-weight: 500;
          color: #222222;
          margin-bottom: 2mm;
        }

        .footer-note {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          font-size: 7.8pt;
          color: #333333;
          letter-spacing: 0.2px;
        }

        .cont-note {
          text-align: right;
          font-style: italic;
          color: #666666;
          font-size: 8.5pt;
          margin-top: 2mm;
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;
}

export async function renderPdfFromHtml(html: string): Promise<Buffer> {
  const executablePath = getBrowserExecutablePath();
  const tempDir = path.join(os.tmpdir(), `kalakar_pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${tempDir}`
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      },
      preferCSSPageSize: true
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close().catch(() => {});
    fs.rm(tempDir, { recursive: true, force: true }, () => {});
  }
}
