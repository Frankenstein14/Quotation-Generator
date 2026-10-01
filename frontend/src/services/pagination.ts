import { InclusionSection, LineItem } from '../types';

export interface RenderInclusionSection {
  title: string;
  subtitle?: string;
  items: string[];
}

export interface InclusionsPageData {
  pageNumber: number;
  title: string;
  leftColumn: RenderInclusionSection[];
  rightColumn: RenderInclusionSection[];
}

export interface QuotationItemsPageData {
  pageNumber: number;
  title: string;
  quotationNumber: string;
  isFirstItemsPage: boolean;
  isLastItemsPage: boolean;
  items: LineItem[];
}

export interface TermsPageData {
  pageNumber: number;
  title: string;
  quotationNumber: string;
  isFirstTermsPage: boolean;
  terms: string[];
}

export interface InvoicePageData {
  pageNumber: number;
  title: string;
  invoiceNumber: string;
  isFirstPage: boolean;
  isLastPage: boolean;
  items: LineItem[];
  terms: string[];
}

const MAX_LINES_PER_INCLUSION_COL = 36;

function calculateSectionLines(sec: InclusionSection | RenderInclusionSection): number {
  let lines = 2.0;
  if (sec.subtitle) lines += 1.4;
  for (const item of sec.items) {
    lines += item.length > 38 ? 2 : 1;
  }
  return lines;
}

export function paginateInclusions(sections: InclusionSection[], startingPage: number = 1): InclusionsPageData[] {
  if (!sections || sections.length === 0) return [];

  const pages: InclusionsPageData[] = [];
  let currentPageNumber = startingPage;

  let currentLeft: RenderInclusionSection[] = [];
  let currentLeftLines = 0;

  let currentRight: RenderInclusionSection[] = [];
  let currentRightLines = 0;

  for (const sec of sections) {
    if (!sec.title && (!sec.items || sec.items.length === 0)) continue;

    const secLines = calculateSectionLines(sec);

    // Try Left Column
    if (currentLeftLines + secLines <= MAX_LINES_PER_INCLUSION_COL) {
      currentLeft.push({
        title: sec.title,
        subtitle: sec.subtitle,
        items: [...sec.items]
      });
      currentLeftLines += secLines + 0.6;
      continue;
    }

    // Try Right Column
    if (currentRightLines + secLines <= MAX_LINES_PER_INCLUSION_COL) {
      currentRight.push({
        title: sec.title,
        subtitle: sec.subtitle,
        items: [...sec.items]
      });
      currentRightLines += secLines + 0.6;
      continue;
    }

    // If section is huge, split across columns
    if (secLines > MAX_LINES_PER_INCLUSION_COL) {
      let remainingItems = [...sec.items];
      let partIndex = 1;

      while (remainingItems.length > 0) {
        let targetCol = 'left';
        let availLines = MAX_LINES_PER_INCLUSION_COL - currentLeftLines;
        if (availLines < 5) {
          availLines = MAX_LINES_PER_INCLUSION_COL - currentRightLines;
          targetCol = 'right';
        }
        if (availLines < 5) {
          pages.push({
            pageNumber: currentPageNumber++,
            title: pages.length === 0 ? 'INCLUSIONS' : 'INCLUSIONS - Continued',
            leftColumn: currentLeft,
            rightColumn: currentRight
          });
          currentLeft = [];
          currentLeftLines = 0;
          currentRight = [];
          currentRightLines = 0;
          availLines = MAX_LINES_PER_INCLUSION_COL;
          targetCol = 'left';
        }

        const headerCost = (partIndex === 1 ? (sec.subtitle ? 3.4 : 2.0) : 1.8);
        let usableLines = availLines - headerCost;
        let takeCount = 0;
        let consumed = 0;
        while (takeCount < remainingItems.length) {
          const itemLines = remainingItems[takeCount].length > 38 ? 2 : 1;
          if (consumed + itemLines > usableLines && takeCount > 0) break;
          consumed += itemLines;
          takeCount++;
        }

        if (takeCount === 0) takeCount = 1;

        const chunkItems = remainingItems.slice(0, takeCount);
        remainingItems = remainingItems.slice(takeCount);

        const subSection: RenderInclusionSection = {
          title: partIndex === 1 ? sec.title : `${sec.title} (Cont.)`,
          subtitle: partIndex === 1 ? sec.subtitle : undefined,
          items: chunkItems
        };

        if (targetCol === 'left') {
          currentLeft.push(subSection);
          currentLeftLines += headerCost + consumed + 0.6;
        } else {
          currentRight.push(subSection);
          currentRightLines += headerCost + consumed + 0.6;
        }

        partIndex++;
      }
      continue;
    }

    // Flush current page and start next
    pages.push({
      pageNumber: currentPageNumber++,
      title: pages.length === 0 ? 'INCLUSIONS' : 'INCLUSIONS - Continued',
      leftColumn: currentLeft,
      rightColumn: currentRight
    });

    currentLeft = [{
      title: sec.title,
      subtitle: sec.subtitle,
      items: [...sec.items]
    }];
    currentLeftLines = secLines + 0.6;
    currentRight = [];
    currentRightLines = 0;
  }

  if (currentLeft.length > 0 || currentRight.length > 0) {
    pages.push({
      pageNumber: currentPageNumber,
      title: pages.length === 0 ? 'INCLUSIONS' : 'INCLUSIONS - Continued',
      leftColumn: currentLeft,
      rightColumn: currentRight
    });
  }

  return pages;
}

export function paginateQuotationItems(items: LineItem[], quotationNumber: string, startingPage: number): QuotationItemsPageData[] {
  const pages: QuotationItemsPageData[] = [];
  const safeItems = items && items.length > 0 ? items : [];

  if (safeItems.length <= 8) {
    pages.push({
      pageNumber: startingPage,
      title: 'QUOTATION',
      quotationNumber,
      isFirstItemsPage: true,
      isLastItemsPage: true,
      items: safeItems
    });
    return pages;
  }

  let pageIndex = 0;
  let remaining = [...safeItems];

  while (remaining.length > 0) {
    const isFirst = pageIndex === 0;
    let capacity = isFirst ? 9 : 14;
    if (!isFirst && remaining.length <= 10) {
      capacity = 10;
    }

    const chunk = remaining.slice(0, capacity);
    remaining = remaining.slice(capacity);
    const isLast = remaining.length === 0;

    pages.push({
      pageNumber: startingPage + pageIndex,
      title: isFirst ? 'QUOTATION' : 'QUOTATION - Continued',
      quotationNumber,
      isFirstItemsPage: isFirst,
      isLastItemsPage: isLast,
      items: chunk
    });

    pageIndex++;
  }

  return pages;
}

export function paginateTerms(terms: string[], quotationNumber: string, startingPage: number): TermsPageData[] {
  const safeTerms = terms && terms.length > 0 ? terms : [];
  const pages: TermsPageData[] = [];

  if (safeTerms.length <= 12) {
    pages.push({
      pageNumber: startingPage,
      title: 'QUOTATION',
      quotationNumber,
      isFirstTermsPage: true,
      terms: safeTerms
    });
    return pages;
  }

  let pageIndex = 0;
  let remaining = [...safeTerms];

  while (remaining.length > 0) {
    const isFirst = pageIndex === 0;
    const capacity = isFirst ? 11 : 20;
    const chunk = remaining.slice(0, capacity);
    remaining = remaining.slice(capacity);

    pages.push({
      pageNumber: startingPage + pageIndex,
      title: isFirst ? 'QUOTATION' : 'QUOTATION - Terms & Conditions (Cont.)',
      quotationNumber,
      isFirstTermsPage: isFirst,
      terms: chunk
    });
    pageIndex++;
  }

  return pages;
}

export function paginateInvoice(items: LineItem[], terms: string[], invoiceNumber: string): InvoicePageData[] {
  const safeItems = items && items.length > 0 ? items : [];
  const safeTerms = terms && terms.length > 0 ? terms : [];
  const pages: InvoicePageData[] = [];

  if (safeItems.length <= 7 && safeTerms.length <= 6) {
    pages.push({
      pageNumber: 1,
      title: 'INVOICE',
      invoiceNumber,
      isFirstPage: true,
      isLastPage: true,
      items: safeItems,
      terms: safeTerms
    });
    return pages;
  }

  let pageIndex = 0;
  let remainingItems = [...safeItems];

  while (remainingItems.length > 0 || (pageIndex === 0)) {
    const isFirst = pageIndex === 0;
    const capacity = isFirst ? 9 : 14;
    const chunk = remainingItems.slice(0, capacity);
    remainingItems = remainingItems.slice(capacity);
    const isLast = remainingItems.length === 0;

    pages.push({
      pageNumber: pageIndex + 1,
      title: isFirst ? 'INVOICE' : 'INVOICE - Continued',
      invoiceNumber,
      isFirstPage: isFirst,
      isLastPage: isLast,
      items: chunk,
      terms: isLast ? safeTerms : []
    });

    pageIndex++;
    if (isLast) break;
  }

  return pages;
}
