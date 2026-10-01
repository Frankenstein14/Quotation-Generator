import React from 'react';
import { LineItem } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Calculator, Tag, Percent } from 'lucide-react';

interface ItemsTableEditorProps {
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
}

export const ItemsTableEditor: React.FC<ItemsTableEditorProps> = ({
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
  onManualGrandTotalChange
}) => {
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: 'item_' + Date.now(),
      description: '',
      quantity: '',
      unit: '',
      rate: '',
      amount: 0
    };
    onItemsChange([...items, newItem]);
  };

  const handleQuickAdd = (desc: string, defaultRate?: number) => {
    const newItem: LineItem = {
      id: 'item_' + Date.now(),
      description: desc,
      quantity: '',
      unit: '',
      rate: defaultRate || '',
      amount: defaultRate || 0
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

    // Auto-calculate amount if quantity and rate are provided
    if (field === 'quantity' || field === 'rate') {
      const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0);
      const r = typeof item.rate === 'string' ? parseFloat(item.rate) : (item.rate || 0);

      if (!isNaN(q) && q > 0 && !isNaN(r) && r > 0) {
        item.amount = Math.round(q * r);
      } else if (!isNaN(r) && r > 0 && (!item.quantity || item.quantity === '')) {
        item.amount = r;
      }
    }

    if (field === 'amount') {
      item.amount = typeof val === 'string' ? parseFloat(val) || 0 : val;
    }

    updated[index] = item;
    onItemsChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Suggestions Bar */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-stone-300 mb-2.5 flex items-center gap-1.5">
          <Tag size={13} className="text-brand-gold" />
          <span>Quick Add Popular Event Services:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Decoration',
            'Photography',
            'Garland',
            'Food & Catering',
            'Return Gifts',
            'Event Planning & Management',
            'Mangalavathiyam with Stage',
            'Iyar with Pooja Material',
            'Welcome Girls with Kit',
            'Sound & DJ System'
          ].map((srv) => (
            <button
              key={srv}
              type="button"
              onClick={() => handleQuickAdd(srv)}
              className="px-2.5 py-1 bg-stone-800/80 hover:bg-stone-700 hover:text-brand-gold-light border border-stone-700/60 rounded-md text-xs text-stone-300 transition"
            >
              + {srv}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2">
            <Calculator size={14} />
            Quotation Items ({items.length})
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-maroon hover:bg-brand-maroon-light border border-brand-gold/40 text-brand-gold-light rounded-lg text-xs font-semibold shadow transition"
          >
            <Plus size={14} />
            <span>Add Item</span>
          </button>
        </div>

        <div className="p-4 space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-[#141217] border border-stone-800/90 rounded-xl p-3 sm:p-3.5 flex flex-col md:flex-row items-start md:items-center gap-2.5 sm:gap-3 transition hover:border-stone-700"
            >
              {/* Row 1 on mobile: Number + Description + Action Buttons */}
              <div className="flex items-center gap-2 w-full flex-1">
                <span className="text-stone-500 font-mono text-xs w-5 text-center shrink-0">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                  placeholder="Item Description (e.g. Stage Decor, Photography...)"
                  className="flex-1 bg-[#1b1820] border border-stone-700/80 rounded-md px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
                <div className="flex md:hidden items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                    title="Move Item Up"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded"
                    title="Move Item Down"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/30"
                    title="Delete Item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Row 2 on mobile / Inline on desktop: Qty, Unit, Rate, Amount */}
              <div className="grid grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto">
                {/* Quantity & Unit */}
                <div className="flex items-center gap-1 md:w-40">
                  <input
                    type="text"
                    value={item.quantity !== undefined ? item.quantity : ''}
                    onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                    placeholder="Qty"
                    className="w-1/2 md:w-16 bg-[#1b1820] border border-stone-700/80 rounded-md px-2 py-1.5 text-xs text-center text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                  />
                  <input
                    type="text"
                    value={item.unit || ''}
                    onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                    placeholder="Unit"
                    className="w-1/2 md:w-24 bg-[#1b1820] border border-stone-700/80 rounded-md px-2 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-brand-gold transition"
                  />
                </div>

                {/* Rate */}
                <div className="md:w-28">
                  <input
                    type="number"
                    value={item.rate !== undefined ? item.rate : ''}
                    onChange={(e) => handleItemFieldChange(idx, 'rate', e.target.value)}
                    placeholder="Rate (₹)"
                    className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md px-2 py-1.5 text-xs text-stone-100 text-right focus:outline-none focus:border-brand-gold transition font-mono"
                  />
                </div>

                {/* Total Amount */}
                <div className="md:w-32">
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => handleItemFieldChange(idx, 'amount', e.target.value)}
                    placeholder="Total (₹)"
                    className="w-full bg-[#1b1820] border border-stone-700/80 rounded-md px-2 py-1.5 text-xs font-semibold text-brand-gold-light text-right focus:outline-none focus:border-brand-gold transition font-mono"
                  />
                </div>
              </div>

              {/* Desktop action buttons */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveItem(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded hover:bg-stone-800 transition"
                  title="Move Item Up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveItem(idx, 'down')}
                  disabled={idx === items.length - 1}
                  className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 rounded hover:bg-stone-800 transition"
                  title="Move Item Down"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(idx)}
                  className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/30 transition"
                  title="Delete Item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-stone-500 text-xs italic">
              No items added yet. Click &quot;Add Item&quot; or choose from the quick services above.
            </div>
          )}
        </div>
      </div>

      {/* Calculations & Totals Panel */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-3 mb-4">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold">
            Totals & Discounts
          </h3>

          {/* Direct Manual Package Total Toggle */}
          {onManualGrandTotalChange && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
              <input
                type="checkbox"
                checked={manualGrandTotal}
                onChange={(e) => onManualGrandTotalChange(e.target.checked)}
                className="rounded border-stone-700 text-brand-maroon focus:ring-brand-gold"
              />
              <span>Directly Enter Package / Grand Total</span>
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Discount & Tax controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Discount
              </label>
              <div className="flex items-center gap-2">
                <div className="flex bg-[#121015] border border-stone-700 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onDiscountTypeChange('fixed')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      discountType === 'fixed'
                        ? 'bg-brand-maroon text-white font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Fixed (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiscountTypeChange('percentage')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      discountType === 'percentage'
                        ? 'bg-brand-maroon text-white font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Percentage (%)
                  </button>
                </div>

                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => onDiscountValueChange(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'fixed' ? 'Amount (₹)' : 'Percent (%)'}
                  className="flex-1 bg-[#121015] border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                GST / Tax Percentage (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={taxPercentage || ''}
                  onChange={(e) => onTaxPercentageChange(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 18 for 18% GST"
                  className="w-40 bg-[#121015] border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
                <span className="text-stone-500 text-xs">(Enter 0 if tax is exempt)</span>
              </div>
            </div>
          </div>

          {/* Right: Calculated Summary Display */}
          <div className="bg-[#141217] border border-stone-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-stone-300">
              <span className="font-medium">Subtotal</span>
              <span className="font-mono text-stone-100 font-semibold">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-stone-300">
                <span>
                  Discount {discountType === 'percentage' ? `(${discountValue}%)` : ''}
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  - ₹{discountAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-stone-300">
                <span>GST / Tax ({taxPercentage}%)</span>
                <span className="font-mono text-stone-100 font-semibold">
                  + ₹{taxAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="pt-2.5 border-t border-stone-700/80 flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-stone-100">
                Grand Total
              </span>
              {manualGrandTotal ? (
                <div className="flex items-center gap-1">
                  <span className="text-brand-gold font-bold">₹</span>
                  <input
                    type="number"
                    value={grandTotal || ''}
                    onChange={(e) => onGrandTotalChange(parseFloat(e.target.value) || 0)}
                    placeholder="Enter final package total"
                    className="w-36 bg-[#1b1820] border border-brand-gold/60 rounded px-2.5 py-1 text-sm font-bold text-brand-gold-light text-right focus:outline-none font-mono"
                  />
                </div>
              ) : (
                <span className="font-serif font-bold text-base text-brand-gold-light">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
