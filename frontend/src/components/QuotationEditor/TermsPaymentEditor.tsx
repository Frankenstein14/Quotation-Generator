import React, { useState } from 'react';
import { CompanySettings } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, CreditCard, ShieldCheck, RotateCcw } from 'lucide-react';

interface TermsPaymentEditorProps {
  company: CompanySettings;
  onCompanyChange: (company: CompanySettings) => void;
  terms: string[];
  onTermsChange: (terms: string[]) => void;
  defaultTerms: string[];
}

export const TermsPaymentEditor: React.FC<TermsPaymentEditorProps> = ({
  company,
  onCompanyChange,
  terms,
  onTermsChange,
  defaultTerms
}) => {
  const [newTermInput, setNewTermInput] = useState('');

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    onTermsChange([...terms, newTermInput.trim()]);
    setNewTermInput('');
  };

  const handleUpdateTerm = (index: number, val: string) => {
    const updated = [...terms];
    updated[index] = val;
    onTermsChange(updated);
  };

  const handleDeleteTerm = (index: number) => {
    const updated = terms.filter((_, i) => i !== index);
    onTermsChange(updated);
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === terms.length - 1)
    ) {
      return;
    }
    const updated = [...terms];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onTermsChange(updated);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset terms to company default terms & conditions?')) {
      onTermsChange([...defaultTerms]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact & Payment Information Overrides */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
          <CreditCard size={14} />
          Payment Methods & Bank Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={company.accountName || ''}
              onChange={(e) => onCompanyChange({ ...company, accountName: e.target.value })}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Bank Name / Branch
            </label>
            <input
              type="text"
              value={company.branch || ''}
              onChange={(e) => onCompanyChange({ ...company, branch: e.target.value })}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Account Number
            </label>
            <input
              type="text"
              value={company.accountNumber || ''}
              onChange={(e) => onCompanyChange({ ...company, accountNumber: e.target.value })}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              IFSC Code
            </label>
            <input
              type="text"
              value={company.ifsc || ''}
              onChange={(e) => onCompanyChange({ ...company, ifsc: e.target.value })}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              UPI ID
            </label>
            <input
              type="text"
              value={company.upiId || ''}
              onChange={(e) => onCompanyChange({ ...company, upiId: e.target.value })}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Terms & Conditions */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 mb-4">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2">
            <ShieldCheck size={14} />
            Terms & Conditions ({terms.length})
          </h3>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-400 hover:text-brand-gold transition"
            title="Reset to default company terms"
          >
            <RotateCcw size={12} />
            <span>Reset to Defaults</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {terms.map((term, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-[#141217] border border-stone-800 rounded-lg p-2.5 group transition hover:border-stone-700"
            >
              <span className="font-bold text-stone-500 text-xs mt-1.5 select-none">&#8226;</span>
              <textarea
                rows={2}
                value={term}
                onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                className="flex-1 bg-transparent border-0 text-xs text-stone-200 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-1 self-center">
                <button
                  type="button"
                  onClick={() => handleMoveTerm(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                  title="Move Up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveTerm(idx, 'down')}
                  disabled={idx === terms.length - 1}
                  className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                  title="Move Down"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTerm(idx)}
                  className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/30"
                  title="Delete Term"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Term */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newTermInput}
              onChange={(e) => setNewTermInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTerm();
                }
              }}
              placeholder="Type new term & condition and press Enter..."
              className="flex-1 bg-[#121015] border border-stone-700 rounded-lg px-3.5 py-2 text-xs text-stone-200 focus:outline-none focus:border-brand-gold transition placeholder-stone-600"
            />
            <button
              type="button"
              onClick={handleAddTerm}
              className="flex items-center gap-1 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-brand-gold-light transition"
            >
              <Plus size={14} />
              <span>Add Term</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
