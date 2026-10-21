import React, { useState, useEffect, useRef } from 'react';
import { Invoice, CompanySettings } from '../../types';
import { ClientEventForm } from '../QuotationEditor/ClientEventForm';
import { InvoiceItemsEditor } from './InvoiceItemsEditor';
import { InvoiceDocument } from '../Preview/InvoiceDocument';
import { DocumentViewer } from '../Preview/DocumentViewer';
import { exportDocumentToPdf } from '../../services/pdfExporter';
import { api } from '../../services/api';
import { ArrowLeft, Save, Eye, Edit3, CheckCircle2, AlertCircle, CreditCard, ShieldCheck, CloudCheck, Loader2, Upload, Trash2 } from 'lucide-react';

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

  // Autosave status: 'saved' | 'saving' | 'unsaved' | 'error'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const lastSavedJsonRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

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
      paymentScheduleTitle: 'Payments methods',
      items: [
        { id: '1', description: 'first stage : 30% OCT', amount: 75000, status: 'PAID' },
        { id: '2', description: 'second stage : 40% NOV', amount: 98000, status: '' },
        { id: '3', description: 'Third stage : 30% (end of the event)', amount: 72000, status: '' }
      ],
      subtotal: 245000,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 245000,
      manualGrandTotal: false,
      amountPaid: 75000,
      balanceDue: 170000,
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
      signatureUrl: defaultSettings.signatureUrl || undefined,
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

  // Recalculate Subtotal, Grand Total, and Balance whenever items, discount, or tax change
  useEffect(() => {
    const sub = invoice.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

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
    const finalGrand = invoice.manualGrandTotal ? invoice.grandTotal : calculatedGrand;

    const autoPaid = invoice.items
      .filter(i => (i.status || '').trim().toUpperCase() === 'PAID')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const effectivePaid = invoice.amountPaid !== undefined ? invoice.amountPaid : autoPaid;
    const calculatedBalance = Math.max(0, finalGrand - effectivePaid);

    setInvoice(prev => ({
      ...prev,
      subtotal: sub,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      grandTotal: finalGrand,
      balanceDue: calculatedBalance
    }));
  }, [
    invoice.items,
    invoice.discountType,
    invoice.discountValue,
    invoice.taxPercentage,
    invoice.manualGrandTotal,
    invoice.amountPaid
  ]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Set baseline snapshot on initial mount
  useEffect(() => {
    lastSavedJsonRef.current = JSON.stringify(invoice);
  }, []);

  // Autosave effect with debounce
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const currentJson = JSON.stringify(invoice);
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    // Determine if this is a brand new invoice with no content yet
    const isNewDoc = !invoice.id && !invoice._id;
    const hasMeaningfulContent = Boolean(
      invoice.client.name.trim() ||
      invoice.items.length > 0 ||
      invoice.client.phone
    );

    if (isNewDoc && !hasMeaningfulContent) {
      return;
    }

    setSaveStatus('unsaved');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [invoice]);

  const performAutoSave = async () => {
    if (isSavingRef.current) return;
    const currentJson = JSON.stringify(invoice);
    if (currentJson === lastSavedJsonRef.current) {
      setSaveStatus('saved');
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');

      let saved: Invoice;
      const docId = invoice._id || invoice.id;
      if (docId) {
        saved = await api.updateInvoice(docId, invoice);
      } else {
        saved = await api.createInvoice(invoice);
        setInvoice(prev => ({
          ...prev,
          id: saved.id,
          _id: saved._id
        }));
      }

      lastSavedJsonRef.current = JSON.stringify(saved);
      onSaved(saved);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedAt(timeStr);
      setSaveStatus('saved');
    } catch (err) {
      console.warn('Invoice autosave warning:', err);
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
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

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    try {
      setIsSaving(true);
      isSavingRef.current = true;
      setSaveStatus('saving');

      let saved: Invoice;
      const docId = invoice._id || invoice.id;
      if (docId) {
        saved = await api.updateInvoice(docId, invoice);
      } else {
        saved = await api.createInvoice(invoice);
      }

      lastSavedJsonRef.current = JSON.stringify(saved);
      setInvoice(saved);
      showToast('success', 'Invoice saved successfully!');
      onSaved(saved);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedAt(timeStr);
      setSaveStatus('saved');
    } catch (e: any) {
      setSaveStatus('error');
      showToast('error', e.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  const handleBack = async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    if (saveStatus === 'unsaved' && !isSavingRef.current) {
      try {
        await performAutoSave();
      } catch {}
    }
    onBack();
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

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Signature file size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setInvoice(prev => ({
        ...prev,
        signatureUrl: result
      }));
      showToast('success', 'Digital signature uploaded successfully!');
    };
    reader.onerror = () => {
      showToast('error', 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSignature = () => {
    setInvoice(prev => ({
      ...prev,
      signatureUrl: undefined
    }));
    showToast('success', 'Digital signature removed.');
  };

  const renderSignatureCard = () => (
    <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-stone-800/80">
        <div>
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2">
            <Upload size={14} />
            Authorized Digital Signature
          </h3>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Upload your digital signature to appear directly between &ldquo;For {invoice.company.companyName}&rdquo; and &ldquo;{invoice.signatureText || 'Authorized Signatory'}&rdquo;.
          </p>
        </div>

        {invoice.signatureUrl && (
          <button
            type="button"
            onClick={handleRemoveSignature}
            className="self-start sm:self-auto text-[11px] font-medium text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 transition"
            title="Remove digital signature from this invoice"
          >
            <Trash2 size={12} />
            <span>Remove Signature</span>
          </button>
        )}
      </div>

      {invoice.signatureUrl ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#121015] border border-stone-800">
          <div className="w-48 h-20 bg-white rounded-lg border border-stone-700/80 p-2 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
            <img
              src={invoice.signatureUrl}
              alt="Signature Preview"
              className="max-h-full max-w-full object-contain select-none"
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Digital Signature Active</span>
            </div>
            <p className="text-[11px] text-stone-400">
              This signature is placed directly on the document above the signatory line and included in PDF downloads.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition">
                <Upload size={12} className="text-brand-gold" />
                <span>Replace Signature</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureUpload}
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <label className="group flex flex-col items-center justify-center border-2 border-dashed border-stone-700/90 hover:border-brand-gold/70 rounded-xl p-6 cursor-pointer bg-[#121015]/60 hover:bg-[#141217] transition">
          <div className="w-12 h-12 rounded-full bg-brand-maroon/30 border border-brand-gold/40 flex items-center justify-center mb-2.5 group-hover:scale-105 transition shadow-sm">
            <Upload size={18} className="text-brand-gold" />
          </div>
          <span className="text-xs font-semibold text-stone-200 group-hover:text-brand-gold-light transition">
            Click or drag to upload Digital Signature
          </span>
          <span className="text-[11px] text-stone-500 mt-1">
            PNG (transparent background recommended), JPG, SVG &middot; Max 5MB
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSignatureUpload}
          />
        </label>
      )}
    </div>
  );

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
            onClick={handleBack}
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

        {/* Action Buttons & Autosave Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Autosave Status Badge */}
          <div className="flex items-center">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/90 text-brand-gold-light text-[11px] border border-stone-700/80 shadow-sm animate-pulse">
                <Loader2 size={12} className="animate-spin text-brand-gold" />
                <span>Autosaving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-[11px] border border-emerald-800/40 shadow-sm"
                title={lastSavedAt ? `Autosaved at ${lastSavedAt}` : 'All changes saved'}
              >
                <CloudCheck size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">{lastSavedAt ? `Saved ${lastSavedAt}` : 'Saved'}</span>
                <span className="sm:hidden">Saved</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-300 text-[11px] border border-amber-800/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Unsaved changes...</span>
                <span className="sm:hidden">Unsaved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/40 text-red-300 text-[11px] border border-red-800/40 shadow-sm"
                title="Cloud sync issue - changes are preserved locally in browser"
              >
                <AlertCircle size={12} className="text-red-400" />
                <span>Saved locally</span>
              </span>
            )}
          </div>

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
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'payment'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>3. Payment & Digital Signature</span>
              {invoice.signatureUrl ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" title="Signature active" />
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
                  Upload Box
                </span>
              )}
            </button>
          </div>

          {/* Tab Contents: Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'items' && (
              <div className="space-y-6">
                <InvoiceItemsEditor
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
                  paymentScheduleTitle={invoice.paymentScheduleTitle}
                  onPaymentScheduleTitleChange={(paymentScheduleTitle) => setInvoice(prev => ({ ...prev, paymentScheduleTitle }))}
                  amountPaid={invoice.amountPaid}
                  onAmountPaidChange={(amountPaid) => setInvoice(prev => ({ ...prev, amountPaid }))}
                  balanceDue={invoice.balanceDue}
                />

                {/* Digital Signature Upload Box (accessible right from the Items tab) */}
                {renderSignatureCard()}
              </div>
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

                {/* Digital Signature Upload Card */}
                {renderSignatureCard()}

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
