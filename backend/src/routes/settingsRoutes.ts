import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SettingsRepository } from '../models/CompanySettings.js';
import { UPLOADS_DIR } from '../config.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const settings = await SettingsRepository.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const updated = await SettingsRepository.updateSettings(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const logoUrl = `/uploads/${req.file.filename}`;
    const updated = await SettingsRepository.updateSettings({ logoUrl });
    res.json({ logoUrl, settings: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
