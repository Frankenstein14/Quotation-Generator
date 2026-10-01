import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MONGODB_URI, DATA_DIR, DEFAULT_COMPANY_SETTINGS } from './config.js';

let isMongoConnected = false;
const LOCAL_DB_PATH = path.join(DATA_DIR, 'kalakar_db.json');

interface LocalDatabase {
  settings: any;
  quotations: any[];
  invoices: any[];
}

function initLocalDatabase(): LocalDatabase {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'));
      if (!data.settings) data.settings = { ...DEFAULT_COMPANY_SETTINGS, _id: 'default' };
      if (!data.quotations) data.quotations = [];
      if (!data.invoices) data.invoices = [];
      return data;
    } catch (e) {
      console.warn('Failed to parse local DB, reinitializing:', e);
    }
  }

  const initial: LocalDatabase = {
    settings: { ...DEFAULT_COMPANY_SETTINGS, _id: 'default' },
    quotations: [],
    invoices: []
  };
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
  return initial;
}

let localDb: LocalDatabase = initLocalDatabase();

function saveLocalDatabase() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2));
  } catch (err) {
    console.error('Error saving local DB file:', err);
  }
}

export async function connectDB() {
  try {
    console.log(`Attempting to connect to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log('Successfully connected to MongoDB.');
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`MongoDB not available (${error.message}). Using local JSON persistent document store at ${LOCAL_DB_PATH}.`);
  }
}

export function isUsingMongo() {
  return isMongoConnected;
}

// Local Document Store Model Abstraction
export class LocalCollection<T extends { _id?: string; id?: string; createdAt?: string; updatedAt?: string }> {
  constructor(private collectionName: 'settings' | 'quotations' | 'invoices') {}

  async find(filter?: any): Promise<T[]> {
    if (this.collectionName === 'settings') {
      return [localDb.settings as T];
    }
    const list = localDb[this.collectionName] as T[];
    if (!filter || Object.keys(filter).length === 0) {
      return [...list].reverse();
    }
    return list.filter((item: any) => {
      for (const key of Object.keys(filter)) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    }).reverse();
  }

  async findById(id: string): Promise<T | null> {
    if (this.collectionName === 'settings') {
      return (localDb.settings as T) || null;
    }
    const list = localDb[this.collectionName] as T[];
    const item = list.find((d: any) => d._id === id || d.id === id);
    return item ? { ...item } : null;
  }

  async findOne(filter?: any): Promise<T | null> {
    const results = await this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  async create(doc: any): Promise<T> {
    const now = new Date().toISOString();
    const id = doc._id || doc.id || ('doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const newDoc = {
      ...doc,
      _id: id,
      id: id,
      createdAt: doc.createdAt || now,
      updatedAt: now
    };

    if (this.collectionName === 'settings') {
      localDb.settings = newDoc;
    } else {
      localDb[this.collectionName].push(newDoc);
    }
    saveLocalDatabase();
    return newDoc as T;
  }

  async findByIdAndUpdate(id: string, update: any, options: { new?: boolean } = { new: true }): Promise<T | null> {
    const now = new Date().toISOString();
    if (this.collectionName === 'settings') {
      localDb.settings = { ...localDb.settings, ...update, updatedAt: now };
      saveLocalDatabase();
      return localDb.settings as T;
    }

    const list = localDb[this.collectionName] as any[];
    const index = list.findIndex(d => d._id === id || d.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...update,
      _id: list[index]._id,
      id: list[index].id,
      updatedAt: now
    };
    saveLocalDatabase();
    return list[index] as T;
  }

  async findByIdAndDelete(id: string): Promise<boolean> {
    if (this.collectionName === 'settings') {
      return false;
    }
    const list = localDb[this.collectionName] as any[];
    const initialLen = list.length;
    localDb[this.collectionName] = list.filter(d => d._id !== id && d.id !== id);
    const deleted = localDb[this.collectionName].length < initialLen;
    if (deleted) saveLocalDatabase();
    return deleted;
  }
}
