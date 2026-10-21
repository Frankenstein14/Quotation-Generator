import React from 'react';
import { LineItem } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Calculator, Tag, Percent, CheckCircle2, Clock, X } from 'lucide-react';

interface InvoiceItemsEditorProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  subtotal: number;
  discountType: 'fixed' | 'percentage';
  onDiscountTypeChange: (type: 'fixed' | 'percentage') => void;
  discountValue: number;
  onDiscountValueChange: (val: number) => void;
  discountAmount: number;
  taxPercentage: number;
  onTaxPercentageChange: (val: number) => void;
  taxAmount: number;
  grandTotal: number;
  onGrandTotalChange: (val: number) => void;
  manualGrandTotal?: boolean;
  onManualGrandTotalChange?: (val: boolean) => void;
  paymentScheduleTitle?: string;
  onPaymentScheduleTitleChange?: (title: string) => void;
  amountPaid?: number;
  onAmountPaidChange?: (val: number) => void;
  balanceDue?: number;
}

export const InvoiceItemsEditor: React.FC<InvoiceItemsEditorProps> = ({
  items,
  onItemsChange,
  subtotal,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  discountAmount,
  taxPercentage,
  onTaxPercentageChange,
  taxAmount,
  grandTotal,
  onGrandTotalChange,
  manualGrandTotal = false,
  onManualGrandTotalChange,
  paymentScheduleTitle = 'Payments methods',
  onPaymentScheduleTitleChange,
  amountPaid,
  onAmountPaidChange,
  balanceDue
}) => {
  // Compute sum of items marked PAID
  const autoPaidFromItems = items
    .filter(i => (i.status || '').trim().toUpperCase() === 'PAID')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const effectiveAmountPaid = amountPaid !== undefined ? amountPaid : autoPaidFromItems;
  const effectiveBalanceDue = balanceDue !== undefined ? balanceDue : Math.max(0, grandTotal - effectiveAmountPaid);

  const handleAddItem = (initialDesc = '', initialRate = 0, initialStatus = '') => {
    const newItem: LineItem = {
      id: 'inv_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      description: initialDesc,
      amount: initialRate,
      status: initialStatus
    };
    onItemsChange([...items, newItem]);
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onItemsChange(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return;
    }
    const updated = [...items];
    const target = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onItemsChange(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'amount') {
      item.amount = typeof val === 'string' ? parseFloat(val) || 0 : val;
    }

    updated[index] = item;
    onItemsChange(updated);
  };

  const setItemStatus = (index: number, statusVal: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], status: statusVal };
    onItemsChange(updated);

    // If status changed to/from PAID and no manual amountPaid override exists, update it
    if (onAmountPaidChange) {
      const newPaid = updated
        .filter(i => (i.status || '').trim().toUpperCase() === 'PAID')
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      onAmountPaidChange(newPaid);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stage Presets */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
            <Tag size={13} className="text-brand-gold" />
            <span>Quick Add Payment Stages & Services:</span>
          </div>
          {onPaymentScheduleTitleChange && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-400">Section Title:</span>
              <input
                type="text"
                value={paymentScheduleTitle}
                onChange={(e) => onPaymentScheduleTitleChange(e.target.value)}
                placeholder="e.g. Payments methods"
                className="bg-[#121015] border border-stone-700/80 rounded px-2 py-0.5 text-xs text-stone-200 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '1st Stage : 30% OCT (Paid)', desc: 'first stage : 30% OCT', status: 'PAID' },
            { label: '2nd Stage : 40% NOV', desc: 'second stage : 40% NOV', status: '' },
            { label: '3rd Stage : 30% (End of Event)', desc: 'Third stage : 30% (end of the event)', status: '' },
            { label: 'Advance Token : 10%', desc: 'Advance Booking Token : 10%', status: 'PAID' },
            { label: 'Full Payment (100%)', desc: 'Full Settlement (100%)', status: 'PAID' },
            { label: 'Decoration & Stage Setup', desc: 'Decoration & Stage Setup', status: '' },
            { label: 'Photography & Videography', desc: 'Traditional & Candid Photography', status: '' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddItem(preset.desc, 0, preset.status)}
              className="px-2.5 py-1 bg-stone-800/80 hover:bg-stone-700 hover:text-brand-gold-light border border-stone-700/60 rounded-md text-xs text-stone-300 transition flex items-center gap-1.5"
            >
              <span>+ {preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Items Table (Description | Value | Status) */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-brand-gold" />
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold">
              Invoice Breakdown ({items.length})
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 font-mono hidden sm:inline">
              Format: Description &bull; Value &bull; Status
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleAddItem('', 0, '')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-maroon hover:bg-brand-maroon-light border border-brand-gold/40 text-brand-gold-light rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>
        </div>

        {/* Table Header Labels for Desktop */}
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-[#17151c] border-b border-stone-800/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          <div className="w-6 text-center">#</div>
          <div className="flex-1">Description</div>
          <div className="w-36 text-right pr-2">Value (₹)</div>
          <div className="w-48 text-center">Status</div>
          <div className="w-20 text-right pr-1">Actions</div>
        </div>

        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-xs">
              No items yet. Click &ldquo;Add Row&rdquo; or pick a preset above to begin.
            </div>
          ) : (
            items.map((item, idx) => {
              const isPaid = (item.status || '').trim().toUpperCase() === 'PAID';
              const isPending = (item.status || '').trim().toLowerCase() === 'pending';

              return (
                <div
                  key={item.id || idx}
                  className={`border rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center gap-2.5 sm:gap-3 transition ${
                    isPaid
                      ? 'bg-[#151c17] border-emerald-900/50'
                      : 'bg-[#141217] border-stone-800/90 hover:border-stone-700'
                  }`}
                >
                  {/* Row 1 on mobile: Number + Description + Actions on mobile */}
                  <div className="flex items-center gap-2 w-full flex-1">
                    <span className="text-stone-500 font-mono text-xs w-6 text-center shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                      placeholder="e.g. first stage : 30% OCT or Service Name"
                      className="flex-1 bg-[#1b1820] border border-stone-700/80 rounded-md px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                    />

                    {/* Mobile only action buttons */}
                    <div className="flex md:hidden items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'down')}
                        disabled={idx === items.length - 1}
                        className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/30"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Value (₹) & Status Controls */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
                    {/* Value Input */}
                    <div className="w-full sm:w-36">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-stone-400 text-xs font-mono">₹</span>
                        <input
                          type="number"
                          value={item.amount !== undefined ? item.amount : ''}
                          onChange={(e) => handleItemFieldChange(idx, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md pl-6 pr-2 py-1.5 text-xs text-right text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono font-medium"
                        />
                      </div>
                    </div>

                    {/* Status Pill Selector */}
                    <div className="flex items-center gap-1 bg-[#121015] p-1 rounded-lg border border-stone-800">
                      <button
                        type="button"
                        onClick={() => setItemStatus(idx, isPaid ? '' : 'PAID')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded transition flex items-center gap-1 ${
                          isPaid
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                        }`}
                        title="Toggle PAID status"
                      >
                        <CheckCircle2 size={11} className={isPaid ? 'text-white' : 'text-emerald-500'} />
                        <span>PAID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemStatus(idx, isPending ? '' : 'Pending')}
                        className={`px-2 py-1 text-[11px] rounded transition flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-600/90 text-white font-medium shadow-sm'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                        }`}
                        title="Toggle Pending status"
                      >
                        <Clock size={11} className={isPending ? 'text-white' : 'text-amber-400'} />
                        <span>Pending</span>
                      </button>

                      {item.status && (
                        <button
                          type="button"
                          onClick={() => setItemStatus(idx, '')}
                          className="p-1 text-stone-500 hover:text-stone-300 rounded"
                          title="Clear status"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>

                    {/* Desktop Reorder & Delete */}
                    <div className="hidden md:flex items-center gap-1 w-20 justify-end">
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded hover:bg-stone-800/60 transition"
                        title="Move Up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveItem(idx, 'down')}
                        disabled={idx === items.length - 1}
                        className="p-1.5 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded hover:bg-stone-800/60 transition"
                        title="Move Down"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 transition"
                        title="Delete Row"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Totals & Balance Calculation Card */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
          <Percent size={14} />
          Invoice Totals & Balance Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Adjustments: Discount & Tax */}
          <div className="space-y-4">
            {/* Discount */}
            <div className="bg-[#141217] p-3.5 rounded-lg border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">Discount</span>
                <div className="flex items-center bg-[#1b1820] rounded-md p-0.5 border border-stone-700">
                  <button
                    type="button"
                    onClick={() => onDiscountTypeChange('fixed')}
                    className={`px-2 py-0.5 text-[11px] rounded ${
                      discountType === 'fixed'
                        ? 'bg-brand-maroon text-white font-medium'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    ₹ Fixed
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiscountTypeChange('percentage')}
                    className={`px-2 py-0.5 text-[11px] rounded ${
                      discountType === 'percentage'
                        ? 'bg-brand-maroon text-white font-medium'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
                {discountAmount > 0 && (
                  <span className="text-xs font-mono text-emerald-400 shrink-0">
                    - ₹{discountAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* GST / Tax */}
            <div className="bg-[#141217] p-3.5 rounded-lg border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">GST / Tax (%)</span>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 12, 18].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => onTaxPercentageChange(rate)}
                      className={`px-2 py-0.5 text-[11px] rounded border transition ${
                        taxPercentage === rate
                          ? 'bg-brand-gold text-stone-950 font-bold border-brand-gold'
                          : 'bg-[#1b1820] text-stone-400 border-stone-700 hover:border-stone-600'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={taxPercentage || ''}
                  onChange={(e) => onTaxPercentageChange(parseFloat(e.target.value) || 0)}
                  placeholder="Custom tax %"
                  className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
                {taxAmount > 0 && (
                  <span className="text-xs font-mono text-amber-300 shrink-0">
                    + ₹{taxAmount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {/* Amount Paid Override (if needed) */}
            {onAmountPaidChange && (
              <div className="bg-[#141217] p-3.5 rounded-lg border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-300">Amount Paid (₹)</span>
                  <button
                    type="button"
                    onClick={() => onAmountPaidChange(autoPaidFromItems)}
                    className="text-[10px] text-brand-gold hover:underline"
                    title="Recalculate paid amount from items marked PAID"
                  >
                    Sync from PAID rows (₹{autoPaidFromItems.toLocaleString('en-IN')})
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-stone-400 text-xs font-mono">₹</span>
                  <input
                    type="number"
                    value={effectiveAmountPaid || ''}
                    onChange={(e) => onAmountPaidChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md pl-6 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Breakdown & Balance Display */}
          <div className="bg-[#141217] p-4 rounded-xl border border-stone-800 flex flex-col justify-between">
            <div className="space-y-2.5 pb-4 border-b border-stone-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">Subtotal:</span>
                <span className="text-stone-200 font-mono font-semibold">
                  Rs. {subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">
                    Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}:
                  </span>
                  <span className="text-emerald-400 font-mono">
                    - Rs. {discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">GST / Tax ({taxPercentage}%):</span>
                  <span className="text-amber-400 font-mono">
                    + Rs. {taxAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-semibold pt-1 text-stone-300">
                <span>Grand Total:</span>
                <span className="font-mono text-stone-100">
                  Rs. {grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {effectiveAmountPaid > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-400">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-semibold">
                    Rs. {effectiveAmountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            {/* Document Preview of the Balance Badge */}
            <div className="pt-4">
              <div className="text-[11px] text-stone-400 uppercase tracking-wider mb-2">
                Document Balance Badge Preview
              </div>
              <div className="flex items-center justify-between bg-stone-900/90 p-3 rounded-lg border border-stone-700/60">
                <span className="text-xs font-bold text-stone-100">Balance</span>
                <span className="bg-[#111111] text-white px-3.5 py-1.5 rounded font-mono font-bold text-xs shadow tracking-wide border border-stone-700">
                  Rs. {effectiveBalanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
