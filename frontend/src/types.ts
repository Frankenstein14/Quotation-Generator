export interface CompanySettings {
  _id?: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  website?: string;
  instagram?: string;
  logoUrl?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId?: string;
  defaultTerms: string[];
  defaultPaymentTerms?: string;
}

export interface ClientDetails {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface EventDetails {
  name?: string;
  type: string;
  date: string;
  endDate?: string;
  location: string;
  guestCount?: number | string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity?: number | string;
  unit?: string;
  rate?: number | string;
  amount: number;
}

export interface InclusionSection {
  id: string;
  title: string;
  subtitle?: string;
  items: string[];
}

export interface Quotation {
  id?: string;
  _id?: string;
  quotationNumber: string;
  date: string;
  validUntil?: string;
  company: CompanySettings;
  client: ClientDetails;
  event: EventDetails;
  items: LineItem[];
  subtotal: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  manualGrandTotal?: boolean;
  inclusions: InclusionSection[];
  terms: string[];
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id?: string;
  _id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company: CompanySettings;
  client: ClientDetails;
  event: EventDetails;
  items: LineItem[];
  subtotal: number;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  manualGrandTotal?: boolean;
  amountPaid?: number;
  balanceDue?: number;
  terms: string[];
  paymentDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    upiId?: string;
  };
  signatureText?: string;
  status: 'unpaid' | 'paid' | 'overdue';
  createdAt?: string;
  updatedAt?: string;
}
