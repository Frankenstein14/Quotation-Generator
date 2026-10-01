import mongoose, { Schema } from 'mongoose';
import { CompanySettings } from '../../shared/types.js';
import { isUsingMongo, LocalCollection } from '../db.js';
import { DEFAULT_COMPANY_SETTINGS } from '../config.js';

const CompanySettingsSchema = new Schema<CompanySettings>({
  companyName: { type: String, default: DEFAULT_COMPANY_SETTINGS.companyName },
  address: { type: String, default: DEFAULT_COMPANY_SETTINGS.address },
  phone: { type: String, default: DEFAULT_COMPANY_SETTINGS.phone },
  email: { type: String, default: DEFAULT_COMPANY_SETTINGS.email },
  gstin: { type: String, default: '' },
  website: { type: String, default: '' },
  instagram: { type: String, default: DEFAULT_COMPANY_SETTINGS.instagram },
  logoUrl: { type: String, default: DEFAULT_COMPANY_SETTINGS.logoUrl },
  bankName: { type: String, default: DEFAULT_COMPANY_SETTINGS.bankName },
  accountName: { type: String, default: DEFAULT_COMPANY_SETTINGS.accountName },
  accountNumber: { type: String, default: DEFAULT_COMPANY_SETTINGS.accountNumber },
  ifsc: { type: String, default: DEFAULT_COMPANY_SETTINGS.ifsc },
  branch: { type: String, default: DEFAULT_COMPANY_SETTINGS.branch },
  upiId: { type: String, default: DEFAULT_COMPANY_SETTINGS.upiId },
  defaultTerms: { type: [String], default: DEFAULT_COMPANY_SETTINGS.defaultTerms },
  defaultPaymentTerms: { type: String, default: DEFAULT_COMPANY_SETTINGS.defaultPaymentTerms }
}, { timestamps: true });

const MongoSettingsModel = mongoose.model<CompanySettings>('CompanySettings', CompanySettingsSchema);
const localSettingsCollection = new LocalCollection<CompanySettings & { _id?: string }>('settings');

export const SettingsRepository = {
  async getSettings(): Promise<CompanySettings> {
    if (isUsingMongo()) {
      let settings = await MongoSettingsModel.findOne();
      if (!settings) {
        settings = await MongoSettingsModel.create(DEFAULT_COMPANY_SETTINGS);
      }
      return settings.toObject ? settings.toObject() : settings;
    }
    let settings = await localSettingsCollection.findOne();
    if (!settings) {
      settings = await localSettingsCollection.create(DEFAULT_COMPANY_SETTINGS);
    }
    return settings;
  },

  async updateSettings(update: Partial<CompanySettings>): Promise<CompanySettings> {
    if (isUsingMongo()) {
      let settings = await MongoSettingsModel.findOne();
      if (!settings) {
        settings = await MongoSettingsModel.create({ ...DEFAULT_COMPANY_SETTINGS, ...update });
      } else {
        Object.assign(settings, update);
        await settings.save();
      }
      return settings.toObject ? settings.toObject() : settings;
    }
    const current = await this.getSettings();
    return await localSettingsCollection.findByIdAndUpdate('default', { ...current, ...update }) as CompanySettings;
  }
};
