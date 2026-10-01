import React from 'react';
import { ClientDetails, EventDetails } from '../../types';
import { User, Phone, Mail, MapPin, Calendar, Users, Sparkles, Hash } from 'lucide-react';

interface ClientEventFormProps {
  documentNumber: string;
  onDocumentNumberChange: (val: string) => void;
  documentDate: string;
  onDocumentDateChange: (val: string) => void;
  validUntil?: string;
  onValidUntilChange?: (val: string) => void;
  client: ClientDetails;
  onClientChange: (client: ClientDetails) => void;
  event: EventDetails;
  onEventChange: (event: EventDetails) => void;
  isInvoice?: boolean;
  dueDate?: string;
  onDueDateChange?: (val: string) => void;
}

const EVENT_TYPE_OPTIONS = [
  'Wedding',
  'Reception',
  'Engagement',
  'Birthday',
  'Puberty Function',
  'Corporate',
  'Conference',
  'Baby Shower / Seemantham',
  'House Warming',
  'Other'
];

export const ClientEventForm: React.FC<ClientEventFormProps> = ({
  documentNumber,
  onDocumentNumberChange,
  documentDate,
  onDocumentDateChange,
  validUntil,
  onValidUntilChange,
  client,
  onClientChange,
  event,
  onEventChange,
  isInvoice = false,
  dueDate,
  onDueDateChange
}) => {
  const [customEventType, setCustomEventType] = React.useState(
    EVENT_TYPE_OPTIONS.includes(event.type) ? '' : event.type
  );

  const handleEventTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'Other') {
      onEventChange({ ...event, type: customEventType || 'Special Event' });
    } else {
      onEventChange({ ...event, type: val });
    }
  };

  const handleCustomEventChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomEventType(val);
    onEventChange({ ...event, type: val });
  };

  return (
    <div className="space-y-6">
      {/* 1. Document Number & Date Details */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
          <Hash size={14} />
          {isInvoice ? 'Invoice Details' : 'Quotation Details'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              {isInvoice ? 'Invoice Number *' : 'Quotation Number *'}
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => onDocumentNumberChange(e.target.value)}
              placeholder={isInvoice ? 'INV-2026-001' : 'QT-2026-001'}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              {isInvoice ? 'Invoice Date *' : 'Quotation Date *'}
            </label>
            <input
              type="text"
              value={documentDate}
              onChange={(e) => onDocumentDateChange(e.target.value)}
              placeholder="DD-MM-YYYY (e.g. 20-08-2026)"
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
            />
          </div>

          {isInvoice && onDueDateChange ? (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                value={dueDate || ''}
                onChange={(e) => onDueDateChange(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          ) : onValidUntilChange ? (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Valid Until
              </label>
              <input
                type="text"
                value={validUntil || ''}
                onChange={(e) => onValidUntilChange(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* 2. Client Details */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
          <User size={14} />
          Client Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Client Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={client.name}
                onChange={(e) => onClientChange({ ...client, name: e.target.value })}
                placeholder="e.g. Mr. Shanmugam or Priya & Arjun"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <User size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={client.phone}
                onChange={(e) => onClientChange({ ...client, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <Phone size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={client.email || ''}
                onChange={(e) => onClientChange({ ...client, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <Mail size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Client Address / City
            </label>
            <div className="relative">
              <input
                type="text"
                value={client.address || ''}
                onChange={(e) => onClientChange({ ...client, address: e.target.value })}
                placeholder="e.g. Sholinganallur, Chennai"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <MapPin size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Event Details */}
      <div className="bg-[#1c1920] border border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
          <Sparkles size={14} />
          Event Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Event Type
            </label>
            <select
              value={EVENT_TYPE_OPTIONS.includes(event.type) ? event.type : 'Other'}
              onChange={handleEventTypeSelect}
              className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {!EVENT_TYPE_OPTIONS.includes(event.type) || event.type === 'Other' ? (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Custom Event Type
              </label>
              <input
                type="text"
                value={customEventType}
                onChange={handleCustomEventChange}
                placeholder="Enter custom event type"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Event Sub-title / Name
              </label>
              <input
                type="text"
                value={event.name || ''}
                onChange={(e) => onEventChange({ ...event, name: e.target.value })}
                placeholder="e.g. Sangeet & Reception"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Location / Venue
            </label>
            <div className="relative">
              <input
                type="text"
                value={event.location}
                onChange={(e) => onEventChange({ ...event, location: e.target.value })}
                placeholder="e.g. Sholinganallur or Leela Palace"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <MapPin size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Event Date
            </label>
            <div className="relative">
              <input
                type="text"
                value={event.date}
                onChange={(e) => onEventChange({ ...event, date: e.target.value })}
                placeholder="e.g. 20-08-2026"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <Calendar size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Event End Date (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={event.endDate || ''}
                onChange={(e) => onEventChange({ ...event, endDate: e.target.value })}
                placeholder="e.g. 21-08-2026"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <Calendar size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
              Estimated Guest Count
            </label>
            <div className="relative">
              <input
                type="text"
                value={event.guestCount || ''}
                onChange={(e) => onEventChange({ ...event, guestCount: e.target.value })}
                placeholder="e.g. 300 pax"
                className="w-full bg-[#121015] border border-stone-700/80 rounded-lg pl-9 pr-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-brand-gold transition"
              />
              <Users size={14} className="absolute left-3 top-3 text-stone-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
