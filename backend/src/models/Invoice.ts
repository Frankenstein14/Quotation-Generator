import mongoose, { Schema } from 'mongoose';
import { Invoice } from '../../shared/types.js';
import { isUsingMongo, LocalCollection } from '../db.js';

const InvoiceSchema = new Schema<Invoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  dueDate: { type: String, required: true },
  company: { type: Schema.Types.Mixed, required: true },
  client: {
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  event: {
    name: { type: String, default: '' },
    type: { type: String, default: 'Wedding' },
    date: { type: String, default: '' },
    endDate: { type: String, default: '' },
    location: { type: String, default: '' },
    guestCount: { type: Schema.Types.Mixed, default: '' }
  },
  items: [{
    id: String,
    description: String,
    quantity: Schema.Types.Mixed,
    unit: String,
    rate: Schema.Types.Mixed,
    amount: Number
  }],
  subtotal: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  manualGrandTotal: { type: Boolean, default: false },
  terms: [String],
  paymentDetails: {
    accountName: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    branch: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  signatureText: { type: String, default: 'Authorized Signatory' },
  status: { type: String, enum: ['unpaid', 'paid', 'overdue'], default: 'unpaid' }
}, { timestamps: true });

const MongoInvoiceModel = mongoose.model<Invoice>('Invoice', InvoiceSchema);
const localInvoiceCollection = new LocalCollection<Invoice>('invoices');

export const InvoiceRepository = {
  async getAll(): Promise<Invoice[]> {
    if (isUsingMongo()) {
      const docs = await MongoInvoiceModel.find().sort({ createdAt: -1 });
      return docs.map(d => d.toObject());
    }
    return await localInvoiceCollection.find();
  },

  async getById(id: string): Promise<Invoice | null> {
    if (isUsingMongo()) {
      const doc = await MongoInvoiceModel.findById(id);
      return doc ? doc.toObject() : null;
    }
    return await localInvoiceCollection.findById(id);
  },

  async getByNumber(invoiceNumber: string): Promise<Invoice | null> {
    if (isUsingMongo()) {
      const doc = await MongoInvoiceModel.findOne({ invoiceNumber });
      return doc ? doc.toObject() : null;
    }
    return await localInvoiceCollection.findOne({ invoiceNumber });
  },

  async create(invoice: Partial<Invoice>): Promise<Invoice> {
    if (isUsingMongo()) {
      const doc = await MongoInvoiceModel.create(invoice);
      return doc.toObject();
    }
    return await localInvoiceCollection.create(invoice);
  },

  async update(id: string, update: Partial<Invoice>): Promise<Invoice | null> {
    if (isUsingMongo()) {
      const doc = await MongoInvoiceModel.findByIdAndUpdate(id, update, { new: true });
      return doc ? doc.toObject() : null;
    }
    return await localInvoiceCollection.findByIdAndUpdate(id, update);
  },

  async delete(id: string): Promise<boolean> {
    if (isUsingMongo()) {
      const res = await MongoInvoiceModel.findByIdAndDelete(id);
      return !!res;
    }
    return await localInvoiceCollection.findByIdAndDelete(id);
  },

  async generateNextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const all = await this.getAll();
    const prefix = `INV-${year}-`;
    const matching = all
      .map(i => i.invoiceNumber)
      .filter(n => n && n.startsWith(prefix));

    let maxNum = 0;
    for (const numStr of matching) {
      const suffix = numStr.replace(prefix, '');
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}${nextNum}`;
  }
};
