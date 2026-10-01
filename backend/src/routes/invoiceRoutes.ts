import { Router } from 'express';
import { InvoiceRepository } from '../models/Invoice.js';
import { SettingsRepository } from '../models/CompanySettings.js';
import { generateInvoiceHtml, renderPdfFromHtml } from '../services/pdfService.js';
import { Invoice } from '../../shared/types.js';

const router = Router();

function validateInvoice(inv: any): string | null {
  if (!inv.invoiceNumber || typeof inv.invoiceNumber !== 'string' || !inv.invoiceNumber.trim()) {
    return 'Invoice number is required.';
  }
  if (!inv.client || !inv.client.name || !inv.client.name.trim()) {
    return 'Client name is required.';
  }
  if (!inv.date || !inv.date.trim()) {
    return 'Invoice date is required.';
  }
  return null;
}

// List all invoices
router.get('/', async (req, res) => {
  try {
    const list = await InvoiceRepository.getAll();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto suggest next invoice number
router.get('/next-number', async (req, res) => {
  try {
    const nextNumber = await InvoiceRepository.generateNextNumber();
    res.json({ nextNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await InvoiceRepository.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  try {
    if (!req.body.invoiceNumber || !req.body.invoiceNumber.trim()) {
      req.body.invoiceNumber = await InvoiceRepository.generateNextNumber();
    }
    if (!req.body.company) {
      req.body.company = await SettingsRepository.getSettings();
    }
    const validationError = validateInvoice(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const created = await InvoiceRepository.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const validationError = validateInvoice(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updated = await InvoiceRepository.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const success = await InvoiceRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download PDF for saved invoice
router.get('/:id/pdf', async (req, res) => {
  try {
    const inv = await InvoiceRepository.getById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const html = generateInvoiceHtml(inv);
    const pdfBuffer = await renderPdfFromHtml(html);

    const filename = `Invoice_${inv.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('Invoice PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Generate PDF directly from payload
router.post('/preview-pdf', async (req, res) => {
  try {
    const inv = req.body as Invoice;
    const validationError = validateInvoice(inv);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const html = generateInvoiceHtml(inv);
    const pdfBuffer = await renderPdfFromHtml(html);

    const safeNumber = (inv.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice_${safeNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('Invoice PDF preview generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview: ' + error.message });
  }
});

export default router;
