import React, { useState, useEffect } from 'react';
import { Invoice, CompanySettings } from '../../types';
import { ClientEventForm } from '../QuotationEditor/ClientEventForm';
import { ItemsTableEditor } from '../QuotationEditor/ItemsTableEditor';
import { InvoiceDocument } from '../Preview/InvoiceDocument';
import { DocumentViewer } from '../Preview/DocumentViewer';
import { exportDocumentToPdf } from '../../services/pdfExporter';
import { api } from '../../services/api';
import { ArrowLeft, Save, Eye, Edit3, CheckCircle2, AlertCircle, CreditCard, ShieldCheck } from 'lucide-react';

interface InvoiceEditorProps {
  initialInvoice?: Invoice | null;
  defaultSettings: CompanySettings;
  onBack: () => void;
  onSaved: (invoice: Invoice) => void;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  defaultSettings,
  onBack,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'items' | 'payment'>('items');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [invoice, setInvoice] = useState<Invoice>(() => {
    if (initialInvoice) return initialInvoice;

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    return {
      invoiceNumber: 'INV-2026-001',
      date: formattedDate,
      dueDate: formattedDate,
      company: { ...defaultSettings },
      client: {
        name: 'Mr. Shanmugam',
        phone: '6374672929',
        email: 'shanmugam@example.com',
        address: 'Sholinganallur, Chennai'
      },
      event: {
        name: 'Puberty Function',
        type: 'Puberty Function',
        date: formattedDate,
        location: 'Sholinganallur',
        guestCount: '300'
      },
      items: [
        { id: '1', description: 'Decoration & Stage Setup', quantity: 1, unit: 'Kit', rate: 35000, amount: 35000 },
        { id: '2', description: 'Traditional & Candid Photography', quantity: 1, unit: 'Package', rate: 45000, amount: 45000 },
        { id: '3', description: 'Fresh Flower Garland Set', quantity: 1, unit: 'Set', rate: 8000, amount: 8000 },
        { id: '4', description: 'Catering Service (Morning & Lunch)', quantity: 1, unit: 'Service', rate: 154000, amount: 154000 },
        { id: '5', description: 'Return Gifts with Customized Kit', quantity: 200, unit: 'Nos', rate: 75, amount: 15000 }
      ],
      subtotal: 257000,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 257000,
      manualGrandTotal: false,
      terms: [
        'Payment is due on or before the due date mentioned.',
        'Cheques to be drawn in favor of KALAKAR EVENTS.',
        'Interest @ 18% p.a. will be charged on overdue payments after due date.'
      ],
      paymentDetails: {
        accountName: defaultSettings.accountName,
        bankName: defaultSettings.bankName,
        accountNumber: defaultSettings.accountNumber,
        ifsc: defaultSettings.ifsc,
        branch: defaultSettings.branch,
        upiId: defaultSettings.upiId
      },
      signatureText: 'Authorized Signatory',
      status: 'unpaid'
    };
  });

  // Auto-fetch next invoice number if brand new
  useEffect(() => {
    if (!initialInvoice) {
      api.getNextInvoiceNumber()
        .then((num) => {
          if (num) setInvoice(prev => ({ ...prev, invoiceNumber: num }));
        })
        .catch(() => {});
    }
  }, [initialInvoice]);

  // Recalculate Subtotal and Grand Total whenever items, discount, or tax change
  useEffect(() => {
    const sub = invoice.items.reduce((acc, it) => acc + (it.amount || 0), 0);

    let discAmt = 0;
    if (invoice.discountType === 'percentage') {
      discAmt = Math.round((sub * (invoice.discountValue || 0)) / 100);
    } else {
      discAmt = invoice.discountValue || 0;
    }

    const afterDiscount = Math.max(sub - discAmt, 0);
    let taxAmt = 0;
    if (invoice.taxPercentage && invoice.taxPercentage > 0) {
      taxAmt = Math.round((afterDiscount * invoice.taxPercentage) / 100);
    }

    const calculatedGrand = afterDiscount + taxAmt;

    setInvoice(prev => ({
      ...prev,
      subtotal: sub,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      grandTotal: prev.manualGrandTotal ? prev.grandTotal : calculatedGrand
    }));
  }, [
    invoice.items,
    invoice.discountType,
    invoice.discountValue,
    invoice.taxPercentage,
    invoice.manualGrandTotal
  ]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!invoice.client.name.trim()) {
      showToast('error', 'Client name is required.');
      return;
    }
    if (!invoice.invoiceNumber.trim()) {
      showToast('error', 'Invoice number is required.');
      return;
    }

    try {
      setIsSaving(true);
      let saved: Invoice;
      if (invoice._id || invoice.id) {
        const id = (invoice._id || invoice.id)!;
        saved = await api.updateInvoice(id, invoice);
      } else {
        saved = await api.createInvoice(invoice);
      }
      setInvoice(saved);
      showToast('success', 'Invoice saved successfully!');
      onSaved(saved);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportDocumentToPdf({
        filename: `Invoice_${invoice.invoiceNumber || 'INV'}.pdf`
      });
      showToast('success', 'PDF downloaded successfully!');
    } catch (e: any) {
      console.warn('PDF export error, falling back to window.print():', e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#121015] text-stone-100 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-2xl border text-sm font-medium transition ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/90 border-red-500/50 text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#18161c] border-b border-stone-800/80 z-20 select-none no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-sm sm:text-base text-brand-gold tracking-wide">
                {invoice.invoiceNumber}
              </h2>
              <span className="text-xs text-stone-400 hidden sm:inline">
                ({invoice.client.name || 'New Client'})
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Invoice Generator &middot; Multi-Page A4 Engine
            </p>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden bg-[#121015] border border-stone-700 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setMobileView('editor')}
            className={`px-3 py-1 rounded flex items-center gap-1 font-medium ${
              mobileView === 'editor' ? 'bg-brand-maroon text-white font-semibold' : 'text-stone-400'
            }`}
          >
            <Edit3 size={13} />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`px-3 py-1 rounded flex items-center gap-1 font-medium ${
              mobileView === 'preview' ? 'bg-brand-maroon text-white font-semibold' : 'text-stone-400'
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon border border-brand-gold/40 text-brand-gold-light rounded-lg text-xs font-semibold shadow-lg hover:shadow-brand-maroon/30 transition disabled:opacity-50"
          >
            <Save size={14} className="text-brand-gold" />
            <span>{isSaving ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT: Input Editor */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[#151319] overflow-hidden no-print ${
            mobileView === 'preview' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Tab Navigation */}
          <div className="flex items-center px-4 bg-[#1a1720] border-b border-stone-800 overflow-x-auto no-scrollbar select-none">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'items'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              1. Invoice Items & Totals ({invoice.items.length})
            </button>

            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'client'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              2. Client & Due Dates
            </button>

            <button
              onClick={() => setActiveTab('payment')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'payment'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              3. Payment & Signatory
            </button>
          </div>

          {/* Tab Contents: Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'items' && (
              <ItemsTableEditor
                items={invoice.items}
                onItemsChange={(items) => setInvoice(prev => ({ ...prev, items }))}
                subtotal={invoice.subtotal}
                discountType={invoice.discountType}
                onDiscountTypeChange={(discountType) => setInvoice(prev => ({ ...prev, discountType }))}
                discountValue={invoice.discountValue}
                onDiscountValueChange={(discountValue) => setInvoice(prev => ({ ...prev, discountValue }))}
                discountAmount={invoice.discountAmount}
                taxPercentage={invoice.taxPercentage}
                onTaxPercentageChange={(taxPercentage) => setInvoice(prev => ({ ...prev, taxPercentage }))}
                taxAmount={invoice.taxAmount}
                grandTotal={invoice.grandTotal}
                onGrandTotalChange={(grandTotal) => setInvoice(prev => ({ ...prev, grandTotal }))}
                manualGrandTotal={invoice.manualGrandTotal}
                onManualGrandTotalChange={(manualGrandTotal) => setInvoice(prev => ({ ...prev, manualGrandTotal }))}
              />
            )}

            {activeTab === 'client' && (
              <ClientEventForm
                documentNumber={invoice.invoiceNumber}
                onDocumentNumberChange={(invoiceNumber) => setInvoice(prev => ({ ...prev, invoiceNumber }))}
                documentDate={invoice.date}
                onDocumentDateChange={(date) => setInvoice(prev => ({ ...prev, date }))}
                isInvoice={true}
                dueDate={invoice.dueDate}
                onDueDateChange={(dueDate) => setInvoice(prev => ({ ...prev, dueDate }))}
                client={invoice.client}
                onClientChange={(client) => setInvoice(prev => ({ ...prev, client }))}
                event={invoice.event}
                onEventChange={(event) => setInvoice(prev => ({ ...prev, event }))}
              />
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                {/* Bank Details */}
                <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
                    <CreditCard size={14} />
                    Invoice Payment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={invoice.paymentDetails.accountName || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, accountName: e.target.value }
                          }))
                        }
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Bank Branch
                      </label>
                      <input
                        type="text"
                        value={invoice.paymentDetails.branch || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, branch: e.target.value }
                          }))
                        }
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={invoice.paymentDetails.accountNumber || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, accountNumber: e.target.value }
                          }))
                        }
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={invoice.paymentDetails.ifsc || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, ifsc: e.target.value }
                          }))
                        }
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={invoice.paymentDetails.upiId || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({
                            ...prev,
                            paymentDetails: { ...prev.paymentDetails, upiId: e.target.value }
                          }))
                        }
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                        Signatory Title
                      </label>
                      <input
                        type="text"
                        value={invoice.signatureText || ''}
                        onChange={(e) =>
                          setInvoice(prev => ({ ...prev, signatureText: e.target.value }))
                        }
                        placeholder="e.g. Authorized Signatory"
                        className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
                  <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
                    <ShieldCheck size={14} />
                    Invoice Payment Terms
                  </h3>
                  <div className="space-y-2">
                    {invoice.terms.map((t, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={t}
                        onChange={(e) => {
                          const updated = [...invoice.terms];
                          updated[idx] = e.target.value;
                          setInvoice(prev => ({ ...prev, terms: updated }));
                        }}
                        className="w-full bg-[#141217] border border-stone-700/80 rounded-md px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-brand-gold transition"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live A4 Document Preview */}
        <div
          className={`flex-1 flex flex-col min-w-0 document-preview-column ${
            mobileView === 'editor' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <DocumentViewer
            onDownloadPdf={handleDownloadPdf}
            isGeneratingPdf={isGeneratingPdf}
            docTitle={`Invoice_${invoice.invoiceNumber}`}
          >
            <InvoiceDocument invoice={invoice} />
          </DocumentViewer>
        </div>
      </div>
    </div>
  );
};
