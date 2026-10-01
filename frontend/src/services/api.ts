import { CompanySettings, Quotation, Invoice } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Settings
  async getSettings(): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string; settings: CompanySettings }> {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_BASE}/settings/logo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload logo');
    return res.json();
  },

  // Quotations
  async getQuotations(): Promise<Quotation[]> {
    const res = await fetch(`${API_BASE}/quotations`);
    if (!res.ok) throw new Error('Failed to fetch quotations');
    return res.json();
  },

  async getQuotation(id: string): Promise<Quotation> {
    const res = await fetch(`${API_BASE}/quotations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch quotation');
    return res.json();
  },

  async getNextQuotationNumber(): Promise<string> {
    const res = await fetch(`${API_BASE}/quotations/next-number`);
    if (!res.ok) throw new Error('Failed to get quotation number');
    const data = await res.json();
    return data.nextNumber;
  },

  async createQuotation(data: Partial<Quotation>): Promise<Quotation> {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create quotation' }));
      throw new Error(err.error || 'Failed to create quotation');
    }
    return res.json();
  },

  async updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
    const res = await fetch(`${API_BASE}/quotations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update quotation' }));
      throw new Error(err.error || 'Failed to update quotation');
    }
    return res.json();
  },

  async deleteQuotation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/quotations/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete quotation');
  },

  async downloadQuotationPdf(id: string, quotationNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/quotations/${id}/pdf`);
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    triggerBlobDownload(blob, `Quotation_${quotationNumber || 'QT'}.pdf`);
  },

  async previewQuotationPdf(data: Quotation, quotationNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/quotations/preview-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate preview PDF');
    const blob = await res.blob();
    triggerBlobDownload(blob, `Quotation_${quotationNumber || 'QT'}.pdf`);
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${API_BASE}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async getInvoice(id: string): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
  },

  async getNextInvoiceNumber(): Promise<string> {
    const res = await fetch(`${API_BASE}/invoices/next-number`);
    if (!res.ok) throw new Error('Failed to get invoice number');
    const data = await res.json();
    return data.nextNumber;
  },

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create invoice' }));
      throw new Error(err.error || 'Failed to create invoice');
    }
    return res.json();
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update invoice' }));
      throw new Error(err.error || 'Failed to update invoice');
    }
    return res.json();
  },

  async deleteInvoice(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete invoice');
  },

  async downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/invoices/${id}/pdf`);
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    triggerBlobDownload(blob, `Invoice_${invoiceNumber || 'INV'}.pdf`);
  },

  async previewInvoicePdf(data: Invoice, invoiceNumber: string): Promise<void> {
    const res = await fetch(`${API_BASE}/invoices/preview-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to generate preview PDF');
    const blob = await res.blob();
    triggerBlobDownload(blob, `Invoice_${invoiceNumber || 'INV'}.pdf`);
  },
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}
