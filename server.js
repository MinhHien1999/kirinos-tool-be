import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import connectDB from './config/database.js';

import authRoutes from './routes/authRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';

import {
  errorHandler,
  notFound,
  requestLogger,
} from './middlewares/errorHandler.js';

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log('Using FRONTEND_URL:', FRONTEND_URL);

// 1. Kết nối Database ngay khi khởi động ứng dụng trên Fly.io
connectDB();

// 2. Cấu hình các Middleware cơ bản
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({
    limit: '50mb',
    extended: true,
  })
);
app.use(requestLogger);

app.get('/', (req, res) => {
  res.status(200).send('Kirinos Tool Backend is running!');
});

// 3. Các Routes xử lý API
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;