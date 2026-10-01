import { CompanySettings, Quotation, Invoice } from '../types';
import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'KALAKAR EVENTS',
  address: '18, Subramanium Nagar, near Alex Nagar Road, A Colony, Kumarappapuram, Madhavaram, Chennai, Tamil Nadu - 600051',
  phone: '6374672929',
  email: 'kalakargroups@gmail.com',
  gstin: '',
  website: '',
  instagram: 'kalakargroups',
  logoUrl: '/assets/image3.png',
  bankName: 'AU Small Finance Bank',
  accountName: 'Kalakar Events',
  accountNumber: '2602270599439652',
  ifsc: 'AUBL0002705',
  branch: 'Sowcarpet Branch',
  upiId: '6374672929@okbizaxis',
  defaultTerms: [
    'The Client shall make an initial payment of 30% of the total contract value as the first-stage payment.',
    'First stage of payment will be non-refundable incase of cancellation.',
    'Food, accommodation, and transportation will be charged by the client. Rs.15000/- In-case of outstation',
    'Damages to the equipments or to props at the event will be charged.',
    'Any additional Requirements will be charged with the client',
    'excessive to the budget upon obtaining clients sign-off before Incurring the expense.',
    "Any changes in the decor at the last minute, the company won't be responsible.",
    "Company won't be responsible in climatic situations.",
    'On the day of event the payment will be closed by the client.'
  ],
  defaultPaymentTerms: '30% Advance at booking, 50% one week prior to event, 20% on the day of event before commencement.'
};

// Initial sample reference quotation
const SAMPLE_QUOTATION: Quotation = {
  id: 'doc_ref_2026_001',
  quotationNumber: 'QT-2026-001',
  date: '20-08-2026',
  validUntil: '20-09-2026',
  company: DEFAULT_SETTINGS,
  client: {
    name: 'Mr. Shanmugam',
    phone: '6374672929',
    email: 'kalakargroups@gmail.com',
    address: 'Sholinganallur, Chennai'
  },
  event: {
    name: 'Puberty Function',
    type: 'Puberty Function',
    date: '20-08-2026',
    location: 'Sholinganallur',
    guestCount: '300'
  },
  items: [
    { id: '1', description: 'Decoration', quantity: '', unit: '', rate: 35000, amount: 35000 },
    { id: '2', description: 'Photography', quantity: '', unit: '', rate: 45000, amount: 45000 },
    { id: '3', description: 'Garland', quantity: '', unit: '', rate: 8000, amount: 8000 },
    { id: '4', description: 'Food', quantity: '', unit: '', rate: 154000, amount: 154000 },
    { id: '5', description: 'Return Gifts', quantity: 200, unit: 'Nos', rate: 75, amount: 15000 }
  ],
  subtotal: 257000,
  discountType: 'fixed',
  discountValue: 0,
  discountAmount: 0,
  taxPercentage: 0,
  taxAmount: 0,
  grandTotal: 257000,
  inclusions: [
    {
      id: '1',
      title: 'Photography Inclusions',
      items: ['Traditional Photos', 'Traditional Videos', 'Candid Photos']
    },
    {
      id: '2',
      title: 'Decorations',
      subtitle: 'As per the selected styles and concept',
      items: []
    },
    {
      id: '3',
      title: 'Food Inclusions',
      subtitle: 'Morning Tiffin - 80nos 7am',
      items: [
        'Coffee', 'Kasi halwa', 'Mini ponda', 'Idly', 'Poori', 'pongal',
        'Vadacurry', 'OnionSambar', 'Coconut chutney', 'Kara chutney',
        'Water bottle', 'Banana leaf', 'Service boys'
      ]
    },
    {
      id: '4',
      title: 'Counter items',
      items: ['Ice cream (abucatta)', 'Beeda 200nos', 'Fruits salad -200nos (2fruits)']
    },
    {
      id: '5',
      title: 'Deliverables',
      items: ['Frame', 'Album', 'Retouched Images']
    },
    {
      id: '6',
      title: 'Lunch (300nos)12.pm',
      items: [
        'Special methuvadai', 'Semiya payasam', 'Laddu', 'Corn cutlet',
        'Vazhakka chops/vendakka chips', 'Rice', 'Kathambam Sambar',
        'Rasam', 'Curd', 'Moorekuzhambu/vathakuzhambu',
        'National porial/cabbage poriyal', 'Karunai mazhiyal',
        'Podalanga kootu/veg aviyal', 'Milagu Appalam', 'Moore milaga',
        'Pickle', 'Water bottle', 'Banana leaf', 'Service boys'
      ]
    }
  ],
  terms: DEFAULT_SETTINGS.defaultTerms,
  status: 'sent'
};

// Local storage helper
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

export const api = {
  // Settings
  async getSettings(): Promise<CompanySettings> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('kalakar_settings')
        .select('data')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data?.data) {
        setLocal('kalakar_settings', data.data);
        return data.data as CompanySettings;
      }
    } catch (e) {
      console.warn('Supabase settings query error, falling back to local:', e);
    }

    // 2. Try REST backend if available
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          const s = await res.json();
          setLocal('kalakar_settings', s);
          return s;
        }
      } catch {}
    }

    // 3. Fallback to LocalStorage
    return getLocal<CompanySettings>('kalakar_settings', DEFAULT_SETTINGS);
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    setLocal('kalakar_settings', updated);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_settings').upsert({
        id: 'default',
        data: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase settings sync error:', e);
    }

    // Sync to backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch {}
    }

    return updated;
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string; settings: CompanySettings }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const logoUrl = reader.result as string;
        const updated = await api.updateSettings({ logoUrl });
        resolve({ logoUrl, settings: updated });
      };
      reader.readAsDataURL(file);
    });
  },

  // Quotations
  async getQuotations(): Promise<Quotation[]> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('kalakar_quotations')
        .select('data')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const list = data.map((row: any) => row.data as Quotation);
        setLocal('kalakar_quotations', list);
        return list;
      }
    } catch (e) {
      console.warn('Supabase quotations fetch error, falling back to local:', e);
    }

    // 2. Try REST backend if available
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/quotations`);
        if (res.ok) {
          const list = await res.json();
          setLocal('kalakar_quotations', list);
          return list;
        }
      } catch {}
    }

    // 3. Fallback to LocalStorage (seeded with sample if empty)
    const local = getLocal<Quotation[]>('kalakar_quotations', [SAMPLE_QUOTATION]);
    return local;
  },

  async getQuotation(id: string): Promise<Quotation> {
    const list = await this.getQuotations();
    const found = list.find(q => (q.id === id || q._id === id));
    if (!found) throw new Error('Quotation not found');
    return found;
  },

  async getNextQuotationNumber(): Promise<string> {
    const list = await this.getQuotations();
    const currentYear = new Date().getFullYear();
    const count = list.length + 1;
    return `QT-${currentYear}-${String(count).padStart(3, '0')}`;
  },

  async createQuotation(data: Partial<Quotation>): Promise<Quotation> {
    const id = data.id || data._id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const quotationNumber = data.quotationNumber || await this.getNextQuotationNumber();
    const created: Quotation = {
      ...(data as Quotation),
      id,
      _id: id,
      quotationNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update LocalStorage
    const current = await this.getQuotations();
    const updatedList = [created, ...current.filter(q => (q.id !== id && q._id !== id))];
    setLocal('kalakar_quotations', updatedList);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_quotations').insert({
        id,
        quotation_number: quotationNumber,
        client_name: created.client?.name || '',
        date: created.date || '',
        grand_total: created.grandTotal || 0,
        data: created,
      });
    } catch (e) {
      console.warn('Supabase quotation insert error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/quotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(created),
        });
      } catch {}
    }

    return created;
  },

  async updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
    const currentList = await this.getQuotations();
    const existingIndex = currentList.findIndex(q => (q.id === id || q._id === id));
    const updated: Quotation = {
      ...(existingIndex >= 0 ? currentList[existingIndex] : {} as Quotation),
      ...(data as Quotation),
      id,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = updated;
    } else {
      currentList.unshift(updated);
    }
    setLocal('kalakar_quotations', currentList);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_quotations').upsert({
        id,
        quotation_number: updated.quotationNumber,
        client_name: updated.client?.name || '',
        date: updated.date || '',
        grand_total: updated.grandTotal || 0,
        data: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase quotation upsert error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/quotations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch {}
    }

    return updated;
  },

  async deleteQuotation(id: string): Promise<void> {
    const currentList = await this.getQuotations();
    const filtered = currentList.filter(q => (q.id !== id && q._id !== id));
    setLocal('kalakar_quotations', filtered);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_quotations').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase quotation delete error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/quotations/${id}`, { method: 'DELETE' });
      } catch {}
    }
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('kalakar_invoices')
        .select('data')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const list = data.map((row: any) => row.data as Invoice);
        setLocal('kalakar_invoices', list);
        return list;
      }
    } catch (e) {
      console.warn('Supabase invoices fetch error, falling back to local:', e);
    }

    // 2. Try REST backend if available
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/invoices`);
        if (res.ok) {
          const list = await res.json();
          setLocal('kalakar_invoices', list);
          return list;
        }
      } catch {}
    }

    // 3. Fallback to LocalStorage
    return getLocal<Invoice[]>('kalakar_invoices', []);
  },

  async getInvoice(id: string): Promise<Invoice> {
    const list = await this.getInvoices();
    const found = list.find(inv => (inv.id === id || inv._id === id));
    if (!found) throw new Error('Invoice not found');
    return found;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const list = await this.getInvoices();
    const currentYear = new Date().getFullYear();
    const count = list.length + 1;
    return `INV-${currentYear}-${String(count).padStart(3, '0')}`;
  },

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const id = data.id || data._id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = data.invoiceNumber || await this.getNextInvoiceNumber();
    const created: Invoice = {
      ...(data as Invoice),
      id,
      _id: id,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = await this.getInvoices();
    const updatedList = [created, ...current.filter(inv => (inv.id !== id && inv._id !== id))];
    setLocal('kalakar_invoices', updatedList);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_invoices').insert({
        id,
        invoice_number: invoiceNumber,
        client_name: created.client?.name || '',
        date: created.date || '',
        grand_total: created.grandTotal || 0,
        data: created,
      });
    } catch (e) {
      console.warn('Supabase invoice insert error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(created),
        });
      } catch {}
    }

    return created;
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const currentList = await this.getInvoices();
    const existingIndex = currentList.findIndex(inv => (inv.id === id || inv._id === id));
    const updated: Invoice = {
      ...(existingIndex >= 0 ? currentList[existingIndex] : {} as Invoice),
      ...(data as Invoice),
      id,
      _id: id,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      currentList[existingIndex] = updated;
    } else {
      currentList.unshift(updated);
    }
    setLocal('kalakar_invoices', currentList);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_invoices').upsert({
        id,
        invoice_number: updated.invoiceNumber,
        client_name: updated.client?.name || '',
        date: updated.date || '',
        grand_total: updated.grandTotal || 0,
        data: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Supabase invoice upsert error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/invoices/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch {}
    }

    return updated;
  },

  async deleteInvoice(id: string): Promise<void> {
    const currentList = await this.getInvoices();
    const filtered = currentList.filter(inv => (inv.id !== id && inv._id !== id));
    setLocal('kalakar_invoices', filtered);

    // Sync to Supabase
    try {
      await supabase.from('kalakar_invoices').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase invoice delete error:', e);
    }

    // Sync to REST backend if available
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
      } catch {}
    }
  },

  // PDF Export Handlers
  async downloadQuotationPdf(id: string, quotationNumber: string): Promise<void> {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/quotations/${id}/pdf`);
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `Quotation_${quotationNumber || 'QT'}.pdf`);
          return;
        }
      } catch {}
    }
    // Browser native print-to-PDF fallback
    window.print();
  },

  async previewQuotationPdf(data: Quotation, quotationNumber: string): Promise<void> {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/quotations/preview-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `Quotation_${quotationNumber || 'QT'}.pdf`);
          return;
        }
      } catch {}
    }
    // Browser native print-to-PDF fallback
    window.print();
  },

  async downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void> {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/invoices/${id}/pdf`);
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `Invoice_${invoiceNumber || 'INV'}.pdf`);
          return;
        }
      } catch {}
    }
    // Browser native print-to-PDF fallback
    window.print();
  },

  async previewInvoicePdf(data: Invoice, invoiceNumber: string): Promise<void> {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/invoices/preview-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const blob = await res.blob();
          triggerBlobDownload(blob, `Invoice_${invoiceNumber || 'INV'}.pdf`);
          return;
        }
      } catch {}
    }
    // Browser native print-to-PDF fallback
    window.print();
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
