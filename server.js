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

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('Using FRONTEND_URL:', FRONTEND_URL);

// ❌ XÓA HOẶC COMMENT DÒNG GỌI TRỰC TIẾP NÀY:
// connectDB();

// 1. Cấu hình các Middleware cơ bản trước
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

// 2. 🟢 CHÈN MIDDLEWARE KẾT NỐI DB TẠI ĐÂY
// Đảm bảo kết nối DB luôn sẵn sàng trước khi đi vào các Routes bên dưới
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    // Nếu lỗi kết nối DB, trả về lỗi 500 ngay lập tức chứ không để Vercel bị treo 30 giây
    res.status(500).json({
      success: false,
      message: 'Lỗi kết nối cơ sở dữ liệu ngầm trên Serverless Vercel',
      error: error.message
    });
  }
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