import { useState, useEffect } from 'react';
import { Quotation, Invoice, CompanySettings } from './types';
import { api } from './services/api';
import { HomeScreen } from './components/HomeScreen';
import { QuotationEditor } from './components/QuotationEditor/QuotationEditor';
import { InvoiceEditor } from './components/InvoiceEditor/InvoiceEditor';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: CompanySettings = {
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

export function App() {
  const [view, setView] = useState<'home' | 'quotation_editor' | 'invoice_editor'>('home');
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Initial Data from Backend
  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch((e) => console.warn('Could not load settings from backend:', e));

    api.getQuotations()
      .then(setQuotations)
      .catch((e) => console.warn('Could not load quotations:', e));

    api.getInvoices()
      .then(setInvoices)
      .catch((e) => console.warn('Could not load invoices:', e));
  }, []);

  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setView('quotation_editor');
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setView('invoice_editor');
  };

  const handleEditQuotation = (q: Quotation) => {
    setEditingQuotation(q);
    setView('quotation_editor');
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setView('invoice_editor');
  };

  const handleDeleteQuotation = async (id: string) => {
    try {
      await api.deleteQuotation(id);
      setQuotations(prev => prev.filter(q => (q._id !== id && q.id !== id)));
    } catch (e: any) {
      alert('Failed to delete quotation: ' + e.message);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await api.deleteInvoice(id);
      setInvoices(prev => prev.filter(inv => (inv._id !== id && inv.id !== id)));
    } catch (e: any) {
      alert('Failed to delete invoice: ' + e.message);
    }
  };

  const handleDownloadQuotationPdf = async (id: string, num: string) => {
    try {
      await api.downloadQuotationPdf(id, num);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  const handleDownloadInvoicePdf = async (id: string, num: string) => {
    try {
      await api.downloadInvoicePdf(id, num);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  const handleQuotationSaved = (saved: Quotation) => {
    setQuotations(prev => {
      const idx = prev.findIndex(q => (q._id && q._id === saved._id) || (q.id && q.id === saved.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleInvoiceSaved = (saved: Invoice) => {
    setInvoices(prev => {
      const idx = prev.findIndex(inv => (inv._id && inv._id === saved._id) || (inv.id && inv.id === saved.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  return (
    <>
      {view === 'home' && (
        <HomeScreen
          quotations={quotations}
          invoices={invoices}
          settings={settings}
          onCreateQuotation={handleCreateQuotation}
          onCreateInvoice={handleCreateInvoice}
          onEditQuotation={handleEditQuotation}
          onEditInvoice={handleEditInvoice}
          onDeleteQuotation={handleDeleteQuotation}
          onDeleteInvoice={handleDeleteInvoice}
          onDownloadQuotationPdf={handleDownloadQuotationPdf}
          onDownloadInvoicePdf={handleDownloadInvoicePdf}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {view === 'quotation_editor' && (
        <QuotationEditor
          initialQuotation={editingQuotation}
          defaultSettings={settings}
          onBack={() => setView('home')}
          onSaved={handleQuotationSaved}
        />
      )}

      {view === 'invoice_editor' && (
        <InvoiceEditor
          initialInvoice={editingInvoice}
          defaultSettings={settings}
          onBack={() => setView('home')}
          onSaved={handleInvoiceSaved}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={setSettings}
      />
    </>
  );
}

export default App;
