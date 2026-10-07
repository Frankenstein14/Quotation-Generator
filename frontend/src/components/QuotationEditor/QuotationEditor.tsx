import React, { useState, useEffect } from 'react';
import { Quotation, CompanySettings } from '../../types';
import { ClientEventForm } from './ClientEventForm';
import { InclusionsEditor } from './InclusionsEditor';
import { ItemsTableEditor } from './ItemsTableEditor';
import { TermsPaymentEditor } from './TermsPaymentEditor';
import { QuotationDocument } from '../Preview/QuotationDocument';
import { DocumentViewer } from '../Preview/DocumentViewer';
import { api } from '../../services/api';
import { exportDocumentToPdf } from '../../services/pdfExporter';
import { ArrowLeft, Save, Eye, Edit3, CheckCircle2, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';

interface QuotationEditorProps {
  initialQuotation?: Quotation | null;
  defaultSettings: CompanySettings;
  onBack: () => void;
  onSaved: (quotation: Quotation) => void;
}

export const QuotationEditor: React.FC<QuotationEditorProps> = ({
  initialQuotation,
  defaultSettings,
  onBack,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'client' | 'inclusions' | 'items' | 'terms'>('inclusions');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize Quotation state
  const [quotation, setQuotation] = useState<Quotation>(() => {
    if (initialQuotation) return initialQuotation;

    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    return {
      quotationNumber: 'QT-2026-001',
      date: formattedDate,
      validUntil: '',
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
        { id: '1', description: 'Decoration', quantity: '', unit: '', rate: 35000, amount: 35000 },
        { id: '2', description: 'Photography', quantity: '', unit: '', rate: 45000, amount: 45000 },
        { id: '3', description: 'Garland', quantity: '', unit: '', rate: 8000, amount: 8000 },
        { id: '4', description: 'Food', quantity: '', unit: '', rate: 154000, amount: 154000 },
        { id: '5', description: 'Return Gifts', quantity: 200, unit: '', rate: 75, amount: 15000 }
      ],
      subtotal: 257000,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      grandTotal: 257000,
      manualGrandTotal: false,
      inclusions: [
        {
          id: 'sec_1',
          title: 'Photography Inclusions',
          items: ['Traditional Photos', 'Traditional Videos', 'Candid Photos']
        },
        {
          id: 'sec_2',
          title: 'Decorations',
          subtitle: 'As per the selected styles and concept',
          items: []
        },
        {
          id: 'sec_3',
          title: 'Food Inclusions',
          subtitle: 'Morning Tiffin - 80nos 7am',
          items: [
            'Coffee',
            'Kasi halwa',
            'Mini ponda',
            'Idly',
            'Poori',
            'pongal',
            'Vadacurry',
            'OnionSambar',
            'Coconut chutney',
            'Kara chutney',
            'Water bottle',
            'Banana leaf',
            'Service boys'
          ]
        },
        {
          id: 'sec_4',
          title: 'Counter items',
          items: ['Ice cream (abucatta)', 'Beeda 200nos', 'Fruits salad -200nos (2fruits)']
        },
        {
          id: 'sec_5',
          title: 'Deliverables',
          items: ['Frame', 'Album', 'Retouched Images']
        },
        {
          id: 'sec_6',
          title: 'Lunch (300nos)12.pm',
          items: [
            'Special methuvadai',
            'Semiya payasam',
            'Laddu',
            'Corn cutlet',
            'Vazhakka chops/vendakka chips',
            'Rice',
            'Kathambam Sambar',
            'Rasam',
            'Curd',
            'Moorekuzhambu/vathakuzhambu',
            'National porial/cabbage poriyal',
            'Karunai mazhiyal',
            'Podalanga kootu/veg aviyal',
            'Milagu Appalam',
            'Moore milaga',
            'Pickle',
            'Water bottle',
            'Banana leaf',
            'Service boys'
          ]
        }
      ],
      terms: [...defaultSettings.defaultTerms],
      status: 'draft'
    };
  });

  // Auto-fetch next quotation number if brand new
  useEffect(() => {
    if (!initialQuotation) {
      api.getNextQuotationNumber()
        .then((num) => {
          if (num) setQuotation(prev => ({ ...prev, quotationNumber: num }));
        })
        .catch(() => {});
    }
  }, [initialQuotation]);

  // Recalculate Subtotal and Grand Total whenever items, discount, or tax change
  useEffect(() => {
    const sub = quotation.items.reduce((acc, it) => acc + (it.amount || 0), 0);

    let discAmt = 0;
    if (quotation.discountType === 'percentage') {
      discAmt = Math.round((sub * (quotation.discountValue || 0)) / 100);
    } else {
      discAmt = quotation.discountValue || 0;
    }

    const afterDiscount = Math.max(sub - discAmt, 0);
    let taxAmt = 0;
    if (quotation.taxPercentage && quotation.taxPercentage > 0) {
      taxAmt = Math.round((afterDiscount * quotation.taxPercentage) / 100);
    }

    const calculatedGrand = afterDiscount + taxAmt;

    setQuotation(prev => ({
      ...prev,
      subtotal: sub,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      grandTotal: prev.manualGrandTotal ? prev.grandTotal : calculatedGrand
    }));
  }, [
    quotation.items,
    quotation.discountType,
    quotation.discountValue,
    quotation.taxPercentage,
    quotation.manualGrandTotal
  ]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!quotation.client.name.trim()) {
      showToast('error', 'Client name is required.');
      return;
    }
    if (!quotation.quotationNumber.trim()) {
      showToast('error', 'Quotation number is required.');
      return;
    }

    try {
      setIsSaving(true);
      let saved: Quotation;
      if (quotation._id || quotation.id) {
        const id = (quotation._id || quotation.id)!;
        saved = await api.updateQuotation(id, quotation);
      } else {
        saved = await api.createQuotation(quotation);
      }
      setQuotation(saved);
      showToast('success', 'Quotation saved successfully!');
      onSaved(saved);
    } catch (e: any) {
      showToast('error', e.message || 'Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await exportDocumentToPdf({
        filename: `Quotation_${quotation.quotationNumber || 'QT'}.pdf`
      });
      showToast('success', 'PDF downloaded successfully!');
    } catch (e: any) {
      console.warn('PDF export error, falling back to window.print():', e);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleStartFromBeginning = () => {
    if (window.confirm('Start from the beginning? This will clear client details, items, and inclusions to a clean blank slate.')) {
      const today = new Date();
      const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
      setQuotation(prev => ({
        ...prev,
        client: {
          name: '',
          phone: '',
          email: '',
          address: ''
        },
        event: {
          name: '',
          type: 'Wedding',
          date: formattedDate,
          location: '',
          guestCount: ''
        },
        items: [
          { id: 'item_1', description: '', quantity: '', unit: '', rate: '', amount: 0 }
        ],
        subtotal: 0,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        taxPercentage: 0,
        taxAmount: 0,
        grandTotal: 0,
        manualGrandTotal: false,
        inclusions: [],
        status: 'draft'
      }));
      showToast('success', 'Reset to blank slate! You can create everything from the beginning.');
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
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 bg-[#18161c] border-b border-stone-800/80 z-20 select-none space-y-2 sm:space-y-0 no-print">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-semibold transition"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Home</span>
            </button>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-serif font-bold text-xs sm:text-base text-brand-gold tracking-wide">
                  {quotation.quotationNumber}
                </h2>
                <span className="text-[11px] sm:text-xs text-stone-400 max-w-[110px] sm:max-w-none truncate">
                  ({quotation.client.name || 'New Client'})
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-500 hidden sm:block">
                Quotation Editor &middot; Inclusions on Page 1
              </p>
            </div>
          </div>

          {/* Desktop Reset / Start from Beginning */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartFromBeginning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-brand-gold-light border border-stone-700 rounded-lg text-xs font-semibold transition"
              title="Clear all fields and start everything from the beginning"
            >
              <RotateCcw size={13} />
              <span>Start from Beginning</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon border border-brand-gold/40 text-brand-gold-light rounded-lg text-xs font-semibold shadow-lg hover:shadow-brand-maroon/30 transition disabled:opacity-50"
            >
              <Save size={14} className="text-brand-gold" />
              <span>{isSaving ? 'Saving...' : 'Save Quotation'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Toggle & Start Fresh Button */}
        <div className="flex md:hidden items-center justify-between gap-2 pt-1 border-t border-stone-800/60">
          <div className="flex bg-[#121015] border border-stone-700 rounded-lg p-0.5 text-xs flex-1 max-w-[180px]">
            <button
              onClick={() => setMobileView('editor')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 font-medium ${
                mobileView === 'editor' ? 'bg-brand-maroon text-white font-semibold' : 'text-stone-400'
              }`}
            >
              <Edit3 size={12} />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setMobileView('preview')}
              className={`flex-1 py-1 rounded flex items-center justify-center gap-1 font-medium ${
                mobileView === 'preview' ? 'bg-brand-maroon text-white font-semibold' : 'text-stone-400'
              }`}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartFromBeginning}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-[11px] font-semibold transition"
          >
            <RotateCcw size={12} />
            <span>Start Fresh</span>
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
              onClick={() => setActiveTab('inclusions')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'inclusions'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles size={13} />
              <span>1. Inclusions (Page 1)</span>
            </button>

            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'client'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              2. Client & Event Details
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'items'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              3. Items & Pricing ({quotation.items.length})
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-brand-gold text-brand-gold-light bg-[#201c27]/60'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              4. Payment & Terms
            </button>
          </div>

          {/* Tab Contents: Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'inclusions' && (
              <InclusionsEditor
                inclusions={quotation.inclusions}
                onChange={(inclusions) => setQuotation(prev => ({ ...prev, inclusions }))}
              />
            )}

            {activeTab === 'client' && (
              <ClientEventForm
                documentNumber={quotation.quotationNumber}
                onDocumentNumberChange={(quotationNumber) => setQuotation(prev => ({ ...prev, quotationNumber }))}
                documentDate={quotation.date}
                onDocumentDateChange={(date) => setQuotation(prev => ({ ...prev, date }))}
                validUntil={quotation.validUntil}
                onValidUntilChange={(validUntil) => setQuotation(prev => ({ ...prev, validUntil }))}
                client={quotation.client}
                onClientChange={(client) => setQuotation(prev => ({ ...prev, client }))}
                event={quotation.event}
                onEventChange={(event) => setQuotation(prev => ({ ...prev, event }))}
              />
            )}

            {activeTab === 'items' && (
              <ItemsTableEditor
                items={quotation.items}
                onItemsChange={(items) => setQuotation(prev => ({ ...prev, items }))}
                subtotal={quotation.subtotal}
                discountType={quotation.discountType}
                onDiscountTypeChange={(discountType) => setQuotation(prev => ({ ...prev, discountType }))}
                discountValue={quotation.discountValue}
                onDiscountValueChange={(discountValue) => setQuotation(prev => ({ ...prev, discountValue }))}
                discountAmount={quotation.discountAmount}
                taxPercentage={quotation.taxPercentage}
                onTaxPercentageChange={(taxPercentage) => setQuotation(prev => ({ ...prev, taxPercentage }))}
                taxAmount={quotation.taxAmount}
                grandTotal={quotation.grandTotal}
                onGrandTotalChange={(grandTotal) => setQuotation(prev => ({ ...prev, grandTotal }))}
                manualGrandTotal={quotation.manualGrandTotal}
                onManualGrandTotalChange={(manualGrandTotal) => setQuotation(prev => ({ ...prev, manualGrandTotal }))}
              />
            )}

            {activeTab === 'terms' && (
              <TermsPaymentEditor
                company={quotation.company}
                onCompanyChange={(company) => setQuotation(prev => ({ ...prev, company }))}
                terms={quotation.terms}
                onTermsChange={(terms) => setQuotation(prev => ({ ...prev, terms }))}
                defaultTerms={defaultSettings.defaultTerms}
              />
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
            docTitle={`Quotation_${quotation.quotationNumber}`}
          >
            <QuotationDocument quotation={quotation} />
          </DocumentViewer>
        </div>
      </div>
    </div>
  );
};
