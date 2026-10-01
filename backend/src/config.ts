import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kalakar';

export const ASSETS_DIR = path.resolve(__dirname, '../../assets');
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure data and uploads dirs exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function getBrowserExecutablePath(): string {
  const possiblePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH || '',
    process.env.CHROME_BIN || '',
    process.env.CHROMIUM_PATH || '',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('Chrome or Edge browser executable not found. Please install Chrome or Chromium, or set PUPPETEER_EXECUTABLE_PATH.');
}

export const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'KALAKAR EVENTS',
  address: '18, Subramanium Nagar, near Alex Nagar Road, A Colony, Kumarappapuram, Madhavaram, Chennai, Tamil Nadu - 600051',
  phone: '6374672929',
  email: 'kalakargroups@gmail.com',
  gstin: '',
  website: '',
  instagram: 'kalakargroups',
  logoUrl: '/assets/image3.png',
  bankName: 'AU Small Finance Bank',
  accountName: 'Kalakar Events',
  accountNumber: '2602270599439652',
  ifsc: 'AUBL0002705',
  branch: 'Sowcarpet Branch',
  upiId: '6374672929@okbizaxis',
  defaultTerms: [
    'The Client shall make an initial payment of 30% of the total contract value as the first-stage payment.',
    'First stage of payment will be non-refundable incase of cancellation.',
    'Food, accommodation, and transportation will be charged by the client. Rs.15000/- In-case of outstation',
    'Damages to the equipments or to props at the event will be charged.',
    'Any additional Requirements will be charged with the client',
    'excessive to the budget upon obtaining clients sign-off before Incurring the expense.',
    "Any changes in the decor at the last minute, the company won't be responsible.",
    "Company won't be responsible in climatic situations.",
    'On the day of event the payment will be closed by the client.'
  ],
  defaultPaymentTerms: '30% Advance at booking, 50% one week prior to event, 20% on the day of event before commencement.'
};
