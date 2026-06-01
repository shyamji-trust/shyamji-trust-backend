import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import customerRoutes from './routes/customer.route.js';
import paymentRoutes from './routes/payment.route.js';
import webhookRoutes from './routes/webhook.route.js';
import path from 'node:path';

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
}));

app.use("/api/webhook", webhookRoutes);

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, (error) => {
  if(error) {
    throw new Error(error);
  }
  console.log(`Server is running on port ${port}`);
  console.log('[ENV] SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : '*** MISSING ***');
  console.log('[ENV] SUPABASE_SECRET_KEY:', process.env.SUPABASE_SECRET_KEY ? 'SET' : '*** MISSING ***');
  console.log('[ENV] LIVE_API_KEY:', process.env.LIVE_API_KEY ? 'SET' : '*** MISSING ***');
  console.log('[ENV] LIVE_KEY_SECRET:', process.env.LIVE_KEY_SECRET ? 'SET' : '*** MISSING ***');
  console.log('[ENV] WEBHOOK_KEY:', process.env.WEBHOOK_KEY ? 'SET' : '*** MISSING ***');
  console.log('[ENV] FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
});