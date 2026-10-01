import mongoose, { Schema } from 'mongoose';
import { Quotation } from '../../shared/types.js';
import { isUsingMongo, LocalCollection } from '../db.js';

const QuotationSchema = new Schema<Quotation>({
  quotationNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  validUntil: { type: String },
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
  inclusions: [{
    id: String,
    title: String,
    subtitle: String,
    items: [String]
  }],
  terms: [String],
  notes: String,
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'archived'], default: 'draft' }
}, { timestamps: true });

const MongoQuotationModel = mongoose.model<Quotation>('Quotation', QuotationSchema);
const localQuotationCollection = new LocalCollection<Quotation>('quotations');

export const QuotationRepository = {
  async getAll(): Promise<Quotation[]> {
    if (isUsingMongo()) {
      const docs = await MongoQuotationModel.find().sort({ createdAt: -1 });
      return docs.map(d => d.toObject());
    }
    return await localQuotationCollection.find();
  },

  async getById(id: string): Promise<Quotation | null> {
    if (isUsingMongo()) {
      const doc = await MongoQuotationModel.findById(id);
      return doc ? doc.toObject() : null;
    }
    return await localQuotationCollection.findById(id);
  },

  async getByNumber(quotationNumber: string): Promise<Quotation | null> {
    if (isUsingMongo()) {
      const doc = await MongoQuotationModel.findOne({ quotationNumber });
      return doc ? doc.toObject() : null;
    }
    return await localQuotationCollection.findOne({ quotationNumber });
  },

  async create(quotation: Partial<Quotation>): Promise<Quotation> {
    if (isUsingMongo()) {
      const doc = await MongoQuotationModel.create(quotation);
      return doc.toObject();
    }
    return await localQuotationCollection.create(quotation);
  },

  async update(id: string, update: Partial<Quotation>): Promise<Quotation | null> {
    if (isUsingMongo()) {
      const doc = await MongoQuotationModel.findByIdAndUpdate(id, update, { new: true });
      return doc ? doc.toObject() : null;
    }
    return await localQuotationCollection.findByIdAndUpdate(id, update);
  },

  async delete(id: string): Promise<boolean> {
    if (isUsingMongo()) {
      const res = await MongoQuotationModel.findByIdAndDelete(id);
      return !!res;
    }
    return await localQuotationCollection.findByIdAndDelete(id);
  },

  async generateNextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const all = await this.getAll();
    const prefix = `QT-${year}-`;
    const matching = all
      .map(q => q.quotationNumber)
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
