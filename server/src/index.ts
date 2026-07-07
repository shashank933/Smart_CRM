import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './config/db.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contacts.js';
import companyRoutes from './routes/companies.js';
import dealRoutes from './routes/deals.js';
import invoiceRoutes from './routes/invoices.js';
import conversationRoutes from './routes/conversations.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import activityRoutes from './routes/activities.js';
import workflowRoutes from './routes/workflows.js';
import appRoutes from './routes/apps.js';
import ticketRoutes from './routes/tickets.js';
import integrationRoutes from './routes/integrations.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/apps', appRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Smart CRM server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

start();
