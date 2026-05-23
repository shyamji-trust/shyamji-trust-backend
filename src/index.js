import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import customerRoutes from './routes/customer.route.js';
import paymentRoutes from './routes/payment.route.js';

// Local dev: load from secrets file. In Docker, vars are injected by docker-compose.
dotenv.config({
  path: String.raw`C:\Users\pryoucan\Documents\secrets\shyam-ji-backend\.env`,
  quiet: true,
});

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(o => o.trim()) ?? [];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
  })
);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
