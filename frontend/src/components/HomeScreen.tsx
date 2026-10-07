import React, { useState } from 'react';
import { Quotation, Invoice, CompanySettings } from '../types';
import { Plus, FileText, Settings, Download, Trash2, Edit2, Calendar, User, MapPin, LogIn, LogOut } from 'lucide-react';

interface HomeScreenProps {
  quotations: Quotation[];
  invoices: Invoice[];
  settings: CompanySettings;
  user: any;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onCreateQuotation: () => void;
  onCreateInvoice: () => void;
  onEditQuotation: (q: Quotation) => void;
  onEditInvoice: (inv: Invoice) => void;
  onDeleteQuotation: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onDownloadQuotationPdf: (id: string, num: string) => void;
  onDownloadInvoicePdf: (id: string, num: string) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  quotations,
  invoices,
  user,
  onOpenAuth,
  onSignOut,
  onCreateQuotation,
  onCreateInvoice,
  onEditQuotation,
  onEditInvoice,
  onDeleteQuotation,
  onDeleteInvoice,
  onDownloadQuotationPdf,
  onDownloadInvoicePdf,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'quotations' | 'invoices'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredQuotations = quotations.filter(q =>
    (q.quotationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.event.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.event.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.client.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.event.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inv.event.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#100e13] text-stone-100 flex flex-col justify-between selection:bg-brand-gold selection:text-brand-maroon-dark">
      {/* Top Bar with Settings and Multi-Device Auth */}
      <header className="flex items-center justify-between px-4 sm:px-12 py-4 border-b border-stone-800/80 bg-[#141218]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img
            src="/assets/image3.png"
            alt="Kalakar Events Logo"
            className="w-10 h-10 object-contain drop-shadow"
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-widest text-brand-gold-light uppercase">
              KALAKAR EVENTS
            </span>
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
              Cloud Multi-Device Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-[#1b1722] border border-stone-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Cloud Synced" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-stone-200 max-w-[120px] sm:max-w-[180px] truncate">
                  {user.email}
                </span>
                <span className="text-[9px] text-emerald-400/90 font-medium hidden sm:inline">
                  Synced across devices
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="ml-1 sm:ml-2 text-stone-400 hover:text-red-300 p-1 rounded hover:bg-stone-800 transition"
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon text-brand-gold-light border border-brand-gold/40 rounded-xl text-xs font-semibold shadow-md transition"
              title="Sign in or register to sync across devices"
            >
              <LogIn size={14} className="text-brand-gold" />
              <span>Multi-Device Login</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-brand-gold-light border border-stone-700 rounded-xl text-xs font-semibold transition"
            title="Company Information & Default Settings"
          >
            <Settings size={14} className="text-brand-gold" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-14 space-y-12">
        {/* Brand Showcase */}
        <div className="text-center space-y-4">
          <div className="inline-block relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full bg-gradient-to-b from-[#2e0b14] to-[#121015] border border-brand-gold/40 flex items-center justify-center p-3 shadow-2xl shadow-brand-maroon/30">
              <img
                src="/assets/image3.png"
                alt="Kalakar Mandala"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
          </div>

          <h1 className="font-serif font-extrabold text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-brand-gold-light to-amber-200 tracking-wider">
            KALAKAR EVENTS
          </h1>

          <p className="text-sm sm:text-base font-medium text-stone-400 tracking-widest uppercase">
            Quotation &amp; Invoice Generator
          </p>

          {/* Two Primary Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onCreateQuotation}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-light hover:to-brand-maroon text-brand-gold-light font-serif font-bold text-sm tracking-wider uppercase border border-brand-gold/50 rounded-xl shadow-xl hover:shadow-brand-maroon/50 transition transform hover:-translate-y-0.5"
            >
              <Plus size={18} className="text-brand-gold" />
              <span>Create Quotation</span>
            </button>

            <button
              onClick={onCreateInvoice}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 bg-stone-900/90 hover:bg-stone-800 text-stone-200 font-serif font-bold text-sm tracking-wider uppercase border border-stone-700 hover:border-brand-gold/50 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
            >
              <Plus size={18} className="text-brand-gold" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Saved Documents Section */}
        <div className="bg-[#16131c] border border-stone-800/90 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand-gold" />
              <h2 className="font-serif font-bold text-base text-stone-100 tracking-wide">
                Saved Documents
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              {/* Filter Tabs */}
              <div className="flex bg-[#121015] border border-stone-700/80 rounded-lg p-0.5 text-xs w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition ${
                    activeTab === 'all'
                      ? 'bg-brand-maroon text-white font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  All ({quotations.length + invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab('quotations')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition ${
                    activeTab === 'quotations'
                      ? 'bg-brand-maroon text-white font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Quotes ({quotations.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded transition ${
                    activeTab === 'invoices'
                      ? 'bg-brand-maroon text-white font-semibold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full sm:w-48 bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-brand-gold"
              />
            </div>
          </div>

          {/* List of Documents */}
          <div className="divide-y divide-stone-800/60 mt-2">
            {/* Quotations List */}
            {(activeTab === 'all' || activeTab === 'quotations') &&
              filteredQuotations.map((q) => (
                <div
                  key={q._id || q.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group transition hover:bg-[#1c1824]/40 px-3 rounded-xl"
                >
                  <div className="space-y-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-gold bg-brand-maroon/30 px-2 py-0.5 rounded border border-brand-maroon/60">
                        {q.quotationNumber}
                      </span>
                      <span className="font-semibold text-sm text-stone-100 flex items-center gap-1.5">
                        <User size={13} className="text-stone-400" />
                        {q.client.name || 'Untitled Client'}
                      </span>
                      <span className="text-xs text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                        {q.event.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {q.date}
                      </span>
                      {q.event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {q.event.location}
                        </span>
                      )}
                      <span className="text-stone-300 font-medium">
                        {q.items.length} items &middot; {q.inclusions?.length || 0} categories
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/40">
                    <span className="font-serif font-bold text-base text-brand-gold-light">
                      ₹{q.grandTotal.toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditQuotation(q)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
                        title="Edit Quotation"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onDownloadQuotationPdf((q._id || q.id)!, q.quotationNumber)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-brand-maroon/80 hover:bg-brand-maroon text-brand-gold-light border border-brand-gold/30 rounded-lg text-xs font-medium transition"
                        title="Download PDF"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete quotation ${q.quotationNumber}?`)) {
                            onDeleteQuotation((q._id || q.id)!);
                          }
                        }}
                        className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition"
                        title="Delete Quotation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {/* Invoices List */}
            {(activeTab === 'all' || activeTab === 'invoices') &&
              filteredInvoices.map((inv) => (
                <div
                  key={inv._id || inv.id}
                  className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group transition hover:bg-[#1c1824]/40 px-3 rounded-xl"
                >
                  <div className="space-y-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/60">
                        {inv.invoiceNumber}
                      </span>
                      <span className="font-semibold text-sm text-stone-100 flex items-center gap-1.5">
                        <User size={13} className="text-stone-400" />
                        {inv.client.name || 'Untitled Client'}
                      </span>
                      <span className="text-xs text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded">
                        {inv.event.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Date: {inv.date} &middot; Due: {inv.dueDate}
                      </span>
                      {inv.event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {inv.event.location}
                        </span>
                      )}
                      <span className="text-stone-300 font-medium">
                        {inv.items.length} items
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/40">
                    <span className="font-serif font-bold text-base text-brand-gold-light">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition"
                        title="Edit Invoice"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onDownloadInvoicePdf((inv._id || inv.id)!, inv.invoiceNumber)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-brand-maroon/80 hover:bg-brand-maroon text-brand-gold-light border border-brand-gold/30 rounded-lg text-xs font-medium transition"
                        title="Download PDF"
                      >
                        <Download size={13} />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                            onDeleteInvoice((inv._id || inv.id)!);
                          }
                        }}
                        className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition"
                        title="Delete Invoice"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {filteredQuotations.length === 0 && filteredInvoices.length === 0 && (
              <div className="py-12 text-center space-y-2">
                <p className="text-stone-400 text-sm font-medium">No documents found.</p>
                <p className="text-stone-600 text-xs">
                  Click &quot;Create Quotation&quot; or &quot;Create Invoice&quot; above to generate your first document.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-stone-800/80 text-center text-xs text-stone-500 bg-[#0d0c10]">
        KALAKAR EVENTS &middot; Professional Event Quotation &amp; Invoice Generator &middot; 2026
      </footer>
    </div>
  );
};
