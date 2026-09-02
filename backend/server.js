import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

connectDB();

const app = express();
app.set('trust proxy', 1);
// Apply security headers
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// General rate limiter (1,000 requests per 15 mins for active development & dashboard polling)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// AI endpoints rate limiter (200 requests per 15 mins)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 200,
  message: { success: false, message: 'AI limit reached. Please try again in 15 minutes.' }
});

import { 
  productRoutes, 
  saleRoutes, 
  campaignRoutes, 
  aiRoutes, 
  analyticsRoutes,
  notificationRoutes,
  dashboardRoutes,
  dataRoutes
} from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

app.use('/api/auth', generalLimiter, authRoutes);
app.use('/api/products', generalLimiter, productRoutes);
app.use('/api/sales', generalLimiter, saleRoutes);
app.use('/api/campaigns', generalLimiter, campaignRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/analytics', generalLimiter, analyticsRoutes);
app.use('/api/webhook', generalLimiter, webhookRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/data', generalLimiter, dataRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
