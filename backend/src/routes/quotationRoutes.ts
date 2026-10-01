import { Router } from 'express';
import { QuotationRepository } from '../models/Quotation.js';
import { SettingsRepository } from '../models/CompanySettings.js';
import { generateQuotationHtml, renderPdfFromHtml } from '../services/pdfService.js';
import { Quotation } from '../../shared/types.js';

const router = Router();

function validateQuotation(q: any): string | null {
  if (!q.quotationNumber || typeof q.quotationNumber !== 'string' || !q.quotationNumber.trim()) {
    return 'Quotation number is required.';
  }
  if (!q.client || !q.client.name || !q.client.name.trim()) {
    return 'Client name is required.';
  }
  if (!q.date || !q.date.trim()) {
    return 'Quotation date is required.';
  }
  return null;
}

// List all quotations
router.get('/', async (req, res) => {
  try {
    const list = await QuotationRepository.getAll();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto suggest next quotation number
router.get('/next-number', async (req, res) => {
  try {
    const nextNumber = await QuotationRepository.generateNextNumber();
    res.json({ nextNumber });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get quotation by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await QuotationRepository.getById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new quotation
router.post('/', async (req, res) => {
  try {
    if (!req.body.quotationNumber || !req.body.quotationNumber.trim()) {
      req.body.quotationNumber = await QuotationRepository.generateNextNumber();
    }
    if (!req.body.company) {
      req.body.company = await SettingsRepository.getSettings();
    }
    const validationError = validateQuotation(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const created = await QuotationRepository.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update quotation
router.put('/:id', async (req, res) => {
  try {
    const validationError = validateQuotation(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updated = await QuotationRepository.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    const success = await QuotationRepository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download PDF for saved quotation
router.get('/:id/pdf', async (req, res) => {
  try {
    const q = await QuotationRepository.getById(req.params.id);
    if (!q) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const html = generateQuotationHtml(q);
    const pdfBuffer = await renderPdfFromHtml(html);

    const filename = `Quotation_${q.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Generate PDF directly from payload (for live preview download without needing to save first)
router.post('/preview-pdf', async (req, res) => {
  try {
    const q = req.body as Quotation;
    const validationError = validateQuotation(q);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const html = generateQuotationHtml(q);
    const pdfBuffer = await renderPdfFromHtml(html);

    const safeNumber = (q.quotationNumber || 'QT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Quotation_${safeNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('PDF preview generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF preview: ' + error.message });
  }
});

export default router;
