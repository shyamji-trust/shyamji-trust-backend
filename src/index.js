import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import customerRoutes from './routes/customer.route.js';
import paymentRoutes from './routes/payment.route.js';
import webhookRoutes from './routes/webhook.route.js';

dotenv.config({
  path: String.raw`C:\Users\pryoucan\Documents\secrets\shyam-ji-backend\.env`
});

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
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
});