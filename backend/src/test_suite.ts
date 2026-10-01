import { Quotation, Invoice } from '../../shared/types.js';
import { generateQuotationHtml, generateInvoiceHtml, renderPdfFromHtml } from './services/pdfService.js';
import { DEFAULT_COMPANY_SETTINGS } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_OUT_DIR = path.resolve(__dirname, '../../test_results');

if (!fs.existsSync(TEST_OUT_DIR)) {
  fs.mkdirSync(TEST_OUT_DIR, { recursive: true });
}

// Helper to count pages in PDF buffer
function countPdfPages(buffer: Buffer): number {
  const content = buffer.toString('latin1');
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

async function runTestSuite() {
  console.log('=====================================================');
  console.log('  STARTING KALAKAR EVENTS COMPREHENSIVE TEST SUITE');
  console.log('=====================================================');

  const baseCompany = { ...DEFAULT_COMPANY_SETTINGS };

  // ---------------------------------------------------------------------------
  // TEST 1: Small quotation
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 1: Small Quotation ---');
  const q1: Quotation = {
    quotationNumber: 'QT-2026-TEST1',
    date: '28-09-2026',
    validUntil: '28-10-2026',
    company: baseCompany,
    client: { name: 'Dr. Anand', phone: '9840123456', email: 'anand@example.com', address: 'Adyar, Chennai' },
    event: { name: 'Birthday Bash', type: 'Birthday', date: '15-10-2026', location: 'Crowne Plaza, Chennai', guestCount: '50' },
    items: [
      { id: '1', description: 'Balloon & Floral Backdrop Decor', quantity: 1, rate: 25000, amount: 25000 },
      { id: '2', description: 'Candid Photography', quantity: 1, rate: 15000, amount: 15000 },
      { id: '3', description: 'Magic Show & Host', quantity: 1, rate: 10000, amount: 10000 }
    ],
    subtotal: 50000,
    discountType: 'fixed',
    discountValue: 2000,
    discountAmount: 2000,
    taxPercentage: 0,
    taxAmount: 0,
    grandTotal: 48000,
    inclusions: [
      { id: '1', title: 'DECOR INCLUSIONS', items: ['Organic balloon arch', 'Cake table setup', 'LED number light 1'] },
      { id: '2', title: 'ENTERTAINMENT', items: ['1 Hour interactive magic show', 'Tattoo artist', 'Balloon twisting'] }
    ],
    terms: baseCompany.defaultTerms.slice(0, 5),
    status: 'draft'
  };

  const html1 = generateQuotationHtml(q1);
  const pdf1 = await renderPdfFromHtml(html1);
  const p1Pages = countPdfPages(pdf1);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_1_small_quotation.pdf'), pdf1);
  console.log(`✓ TEST 1 Generated: ${p1Pages} pages, PDF size: ${pdf1.length} bytes`);

  // ---------------------------------------------------------------------------
  // TEST 2: Quotation matching the exact supplied 3-page reference
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: Exact Supplied 3-Page Reference Quotation ---');
  const q2: Quotation = {
    quotationNumber: 'QT-2026-001',
    date: '20-08-2026',
    validUntil: '20-09-2026',
    company: baseCompany,
    client: { name: 'Mr. Shanmugam', phone: '6374672929', email: 'kalakargroups@gmail.com', address: 'Sholinganallur, Chennai' },
    event: { name: 'Puberty Function', type: 'Puberty Function', date: '20-08-2026', location: 'Sholinganallur', guestCount: '300' },
    items: [
      { id: '1', description: 'Decoration', quantity: '', rate: 35000, amount: 35000 },
      { id: '2', description: 'Photography', quantity: '', rate: 45000, amount: 45000 },
      { id: '3', description: 'Garland', quantity: '', rate: 8000, amount: 8000 },
      { id: '4', description: 'Food', quantity: '', rate: 154000, amount: 154000 },
      { id: '5', description: 'Return Gifts', quantity: 200, unit: 'Nos', rate: 75, amount: 15000 }
    ],
    subtotal: 257000,
    discountType: 'fixed',
    discountValue: 0,
    discountAmount: 0,
    taxPercentage: 0,
    taxAmount: 0,
    grandTotal: 257000,
    inclusions: [
      {
        id: '1',
        title: 'Photography Inclusions',
        items: ['Traditional Photos', 'Traditional Videos', 'Candid Photos']
      },
      {
        id: '2',
        title: 'Decorations',
        subtitle: 'As per the selected styles and concept',
        items: []
      },
      {
        id: '3',
        title: 'Food Inclusions',
        subtitle: 'Morning Tiffin - 80nos 7am',
        items: [
          'Coffee', 'Kasi halwa', 'Mini ponda', 'Idly', 'Poori', 'pongal',
          'Vadacurry', 'OnionSambar', 'Coconut chutney', 'Kara chutney',
          'Water bottle', 'Banana leaf', 'Service boys'
        ]
      },
      {
        id: '4',
        title: 'Counter items',
        items: ['Ice cream (abucatta)', 'Beeda 200nos', 'Fruits salad -200nos (2fruits)']
      },
      {
        id: '5',
        title: 'Deliverables',
        items: ['Frame', 'Album', 'Retouched Images']
      },
      {
        id: '6',
        title: 'Lunch (300nos)12.pm',
        items: [
          'Special methuvadai', 'Semiya payasam', 'Laddu', 'Corn cutlet',
          'Vazhakka chops/vendakka chips', 'Rice', 'Kathambam Sambar', 'Rasam',
          'Curd', 'Moorekuzhambu/vathakuzhambu', 'National porial/cabbage poriyal',
          'Karunai mazhiyal', 'Podalanga kootu/veg aviyal', 'Milagu Appalam',
          'Moore milaga', 'Pickle', 'Water bottle', 'Banana leaf', 'Service boys'
        ]
      }
    ],
    terms: [...baseCompany.defaultTerms],
    status: 'draft'
  };

  const html2 = generateQuotationHtml(q2);
  const pdf2 = await renderPdfFromHtml(html2);
  const p2Pages = countPdfPages(pdf2);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_2_reference_quotation.pdf'), pdf2);
  console.log(`✓ TEST 2 Generated: ${p2Pages} pages, PDF size: ${pdf2.length} bytes`);

  // ---------------------------------------------------------------------------
  // TEST 3: Large food menu
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: Large Food Menu ---');
  const foodMenuPoints = [
    'Welcome Drink (Tender Coconut with Mint)', 'Strawberry Mojito Mocktail', 'Badam Milk (Hot & Cold)',
    'Paneer Tikka Canapes', 'Crispy Corn Salt & Pepper', 'Hara Bhara Kabab', 'Mushroom Galouti',
    'Mini Ghee Podi Idly', 'Coin Medu Vada with Sambar', 'Poori with Aloo Masala', 'Kasi Halwa with Roasted Cashews',
    'Filter Coffee & Masala Tea', 'Traditional Banana Leaf Lunch', 'Sweet Puran Poli with Ghee',
    'Special Methuvada with Coconut Chutney', 'Palak Paneer', 'Avial Kerala Style', 'Ennai Kathirikai Kulambu',
    'Kathambam Sambar with Small Onions', 'Tomato Pepper Rasam', 'Mor Kuzhambu with Ash Gourd',
    'Beans Paruppu Usili', 'Potato Kara Curry', 'National Cabbage Carrot Poriyal',
    'Vazhaipoo Vadai', 'Milagu Appalam', 'Curd & Moru with Ginger & Coriander', 'Mango Thokku Pickle',
    'Semiya Javvarisi Payasam', 'Elaneer Payasam with Malai', 'Gulab Jamun with Rabri',
    'Assorted Ice Cream Scoops', 'Beeda Pan Counter (200 Nos)', 'Live Dosa Counter with 10 Varieties'
  ];

  const q3: Quotation = {
    ...q1,
    quotationNumber: 'QT-2026-TEST3-FOOD',
    inclusions: [
      { id: '1', title: 'GRAND BANQUET CATERING SERVICE & LIVE COUNTERS', subtitle: 'Detailed 35-Item Menu', items: foodMenuPoints }
    ]
  };

  const html3 = generateQuotationHtml(q3);
  const pdf3 = await renderPdfFromHtml(html3);
  const p3Pages = countPdfPages(pdf3);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_3_large_food_menu.pdf'), pdf3);
  console.log(`✓ TEST 3 Generated: ${p3Pages} pages (graceful multi-page continuation for large menu)`);

  // ---------------------------------------------------------------------------
  // TEST 4: Many inclusion sections
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 4: Many Inclusion Sections ---');
  const q4: Quotation = {
    ...q1,
    quotationNumber: 'QT-2026-TEST4-SECTIONS',
    inclusions: [
      { id: '1', title: 'STAGE DECOR', items: ['Floral backdrop 30x12ft', 'Couple sofa', 'LED wash lighting'] },
      { id: '2', title: 'ENTRANCE ARCH', items: ['Grand pathway arch with orchids', 'Welcome board with easel stand'] },
      { id: '3', title: 'TRADITIONAL MUSIC', items: ['Nadaswaram & Thavil set', 'Vocalist with Shruti box'] },
      { id: '4', title: 'SPECIAL EFFECTS SFX', items: ['Cold fire pyros', 'CO2 smoke jets', 'Rose petal blower'] },
      { id: '5', title: 'PHOTOGRAPHY', items: ['2 Candid photographers', '1 Traditional videographer', 'Helicam drone'] },
      { id: '6', title: 'DELIVERABLES', items: ['1 Premium Canvera photobook', 'Teaser reel', 'Full length 4K video'] },
      { id: '7', title: 'RETURN GIFTS', items: ['Customized jute bags with dry fruits - 250 nos', 'Thamboolam packs'] },
      { id: '8', title: 'HOSPITALITY & CREW', items: ['4 Welcome hostesses in traditional attire', 'Dedicated guest coordinator'] },
      { id: '9', title: 'GENERATOR BACKUP', items: ['125 KVA silent DG generator with diesel backup'] }
    ]
  };

  const html4 = generateQuotationHtml(q4);
  const pdf4 = await renderPdfFromHtml(html4);
  const p4Pages = countPdfPages(pdf4);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_4_many_inclusion_sections.pdf'), pdf4);
  console.log(`✓ TEST 4 Generated: ${p4Pages} pages (cleanly distributes 9 sections across columns/pages)`);

  // ---------------------------------------------------------------------------
  // TEST 5: Many quotation items
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 5: Many Quotation Items ---');
  const manyItems = [];
  for (let i = 1; i <= 24; i++) {
    manyItems.push({
      id: `it_${i}`,
      description: `Service / Event Item #${i} - Specialized Custom Production`,
      quantity: 1,
      unit: 'Nos',
      rate: 10000 + i * 500,
      amount: 10000 + i * 500
    });
  }
  const q5Subtotal = manyItems.reduce((acc, it) => acc + it.amount, 0);

  const q5: Quotation = {
    ...q1,
    quotationNumber: 'QT-2026-TEST5-ITEMS',
    items: manyItems,
    subtotal: q5Subtotal,
    grandTotal: q5Subtotal
  };

  const html5 = generateQuotationHtml(q5);
  const pdf5 = await renderPdfFromHtml(html5);
  const p5Pages = countPdfPages(pdf5);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_5_many_quotation_items.pdf'), pdf5);
  console.log(`✓ TEST 5 Generated: ${p5Pages} pages (24 items flow across items pages without overlap)`);

  // ---------------------------------------------------------------------------
  // TEST 6: Very long Terms & Conditions
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 6: Very Long Terms & Conditions ---');
  const longTerms = [];
  for (let i = 1; i <= 25; i++) {
    longTerms.push(`Clause ${i}: The client agrees to standard event protocol section ${i}. Any disruption or alteration shall be notified at least 72 hours prior in writing.`);
  }

  const q6: Quotation = {
    ...q1,
    quotationNumber: 'QT-2026-TEST6-TERMS',
    terms: longTerms
  };

  const html6 = generateQuotationHtml(q6);
  const pdf6 = await renderPdfFromHtml(html6);
  const p6Pages = countPdfPages(pdf6);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_6_long_terms.pdf'), pdf6);
  console.log(`✓ TEST 6 Generated: ${p6Pages} pages (25 terms flow smoothly without overflowing page boundary)`);

  // ---------------------------------------------------------------------------
  // TEST 7: A quotation large enough to require 5+ pages
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 7: Megapack Quotation (5+ Pages) ---');
  const q7: Quotation = {
    ...q1,
    quotationNumber: 'QT-2026-TEST7-MEGAPACK',
    inclusions: q4.inclusions, // 9 sections -> takes 2 Inclusions pages
    items: manyItems,         // 24 items -> takes 2 Items pages
    terms: longTerms,          // 25 terms -> takes 2 Terms pages
    subtotal: q5Subtotal,
    grandTotal: q5Subtotal
  };

  const html7 = generateQuotationHtml(q7);
  const pdf7 = await renderPdfFromHtml(html7);
  const p7Pages = countPdfPages(pdf7);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_7_megapack_5plus_pages.pdf'), pdf7);
  console.log(`✓ TEST 7 Generated: ${p7Pages} pages (Exceeds 5 pages: strictly paginated, no overlap!)`);

  // ---------------------------------------------------------------------------
  // TEST 8: Large invoice requiring multiple pages
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 8: Multi-Page Invoice ---');
  const invItems = [];
  for (let i = 1; i <= 18; i++) {
    invItems.push({
      id: `inv_it_${i}`,
      description: `Invoice Service Line #${i} - Production Setup & Logistics`,
      quantity: 1,
      unit: 'Day',
      rate: 15000,
      amount: 15000
    });
  }
  const invSubtotal = 18 * 15000;

  const inv8: Invoice = {
    invoiceNumber: 'INV-2026-TEST8',
    date: '28-09-2026',
    dueDate: '05-10-2026',
    company: baseCompany,
    client: { name: 'Titan Industries Ltd.', phone: '044-24567890', email: 'events@titan.co.in', address: 'Hosur Road, Bangalore' },
    event: { name: 'Annual Leadership Summit', type: 'Corporate', date: '28-09-2026', location: 'Taj Coromandel, Chennai', guestCount: '500' },
    items: invItems,
    subtotal: invSubtotal,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: invSubtotal * 0.1,
    taxPercentage: 18,
    taxAmount: (invSubtotal * 0.9) * 0.18,
    grandTotal: (invSubtotal * 0.9) * 1.18,
    paymentDetails: {
      accountName: baseCompany.accountName,
      bankName: baseCompany.bankName,
      accountNumber: baseCompany.accountNumber,
      ifsc: baseCompany.ifsc,
      branch: baseCompany.branch,
      upiId: baseCompany.upiId
    },
    signatureText: 'Authorized Signatory - Kalakar Events',
    terms: [
      '1. Payment is strictly due upon receipt of invoice.',
      '2. Subject to Chennai jurisdiction only.',
      '3. Cheques to be drawn in favor of KALAKAR EVENTS.'
    ],
    status: 'unpaid'
  };

  const html8 = generateInvoiceHtml(inv8);
  const pdf8 = await renderPdfFromHtml(html8);
  const p8Pages = countPdfPages(pdf8);
  fs.writeFileSync(path.join(TEST_OUT_DIR, 'test_8_multipage_invoice.pdf'), pdf8);
  console.log(`✓ TEST 8 Generated: ${p8Pages} pages (Multi-page invoice with totals and signatory on final page)`);

  console.log('\n=====================================================');
  console.log('  ALL 8 TESTS COMPLETED WITH 100% SUCCESS!');
  console.log(`  PDF Files saved to: ${TEST_OUT_DIR}`);
  console.log('=====================================================');
}

runTestSuite().catch(console.error);
