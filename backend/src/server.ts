import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PORT, ASSETS_DIR, UPLOADS_DIR } from './config.js';
import { connectDB } from './db.js';
import settingsRoutes from './routes/settingsRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static asset folders
app.use('/assets', express.static(ASSETS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// API routes
app.use('/api/settings', settingsRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'KALAKAR EVENTS Quotation & Invoice API',
    time: new Date().toISOString()
  });
});

// Serve built frontend if dist exists
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  KALAKAR EVENTS Web App running on port ${PORT}`);
    console.log(`  Open in browser: http://localhost:${PORT}`);
    console.log(`  API Health: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start backend server:', err);
});
