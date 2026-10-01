import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { api } from '../services/api';
import { X, Save, Upload, RotateCcw, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (settings: CompanySettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings: initialSettings,
  isOpen,
  onClose,
  onSaved
}) => {
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTermInput, setNewTermInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await api.updateSettings(settings);
      onSaved(updated);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setIsUploading(true);
      const res = await api.uploadLogo(file);
      setSettings(prev => ({ ...prev, logoUrl: res.logoUrl }));
    } catch (err: any) {
      alert('Logo upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTerm = () => {
    if (!newTermInput.trim()) return;
    setSettings(prev => ({
      ...prev,
      defaultTerms: [...prev.defaultTerms, newTermInput.trim()]
    }));
    setNewTermInput('');
  };

  const handleDeleteTerm = (index: number) => {
    setSettings(prev => ({
      ...prev,
      defaultTerms: prev.defaultTerms.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1a1720] border border-stone-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#201c27]">
          <div>
            <h2 className="font-serif font-bold text-lg text-brand-gold tracking-wide">
              Company Settings
            </h2>
            <p className="text-xs text-stone-400">
              Default information applied to all new quotations and invoices
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Company Details */}
          <div>
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold-light mb-3">
              Company Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  value={settings.gstin || ''}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  placeholder="Optional GSTIN"
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={settings.instagram || ''}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                  placeholder="e.g. kalakargroups"
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={settings.website || ''}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  placeholder="www.kalakarevents.com"
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="pt-4 border-t border-stone-800">
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold-light mb-3">
              Company Logo
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center overflow-hidden p-1">
                <img
                  src={settings.logoUrl || '/assets/image3.png'}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold cursor-pointer transition">
                  <Upload size={14} />
                  <span>{isUploading ? 'Uploading...' : 'Upload New Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-stone-500 mt-1">
                  Recommended: PNG or JPG with transparent or clean background
                </p>
              </div>
            </div>
          </div>

          {/* Bank & Payment Details */}
          <div className="pt-4 border-t border-stone-800">
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold-light mb-3">
              Default Bank & Payment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.accountName}
                  onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  value={settings.branch}
                  onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.accountNumber}
                  onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={settings.ifsc}
                  onChange={(e) => setSettings({ ...settings, ifsc: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={settings.upiId || ''}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  className="w-full bg-[#121015] border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-brand-gold transition"
                />
              </div>
            </div>
          </div>

          {/* Default Terms & Conditions */}
          <div className="pt-4 border-t border-stone-800">
            <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold-light mb-3">
              Default Terms & Conditions
            </h3>
            <div className="space-y-2 mb-3">
              {settings.defaultTerms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-stone-500 font-bold text-xs select-none">&#8226;</span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => {
                      const updated = [...settings.defaultTerms];
                      updated[idx] = e.target.value;
                      setSettings({ ...settings, defaultTerms: updated });
                    }}
                    className="flex-1 bg-[#121015] border border-stone-700 rounded-md px-2.5 py-1 text-xs text-stone-200 focus:outline-none focus:border-brand-gold transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTerm(idx)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTermInput}
                onChange={(e) => setNewTermInput(e.target.value)}
                placeholder="Add new default term..."
                className="flex-1 bg-[#121015] border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-brand-gold transition"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-6 border-t border-stone-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-brand-maroon hover:bg-brand-maroon-light text-brand-gold-light border border-brand-gold/40 rounded-lg text-xs font-semibold shadow-lg transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
