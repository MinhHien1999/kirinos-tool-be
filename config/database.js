import mongoose from 'mongoose';

// Tạo một biến toàn cục để lưu lại trạng thái kết nối
let isConnected = false;

const connectDB = async () => {
  // 1. Nếu đã có kết nối trước đó, dùng lại luôn, không tạo kết nối mới
  if (isConnected) {
    console.log('🔄 Sử dụng lại kết nối MongoDB có sẵn');
    return true;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI chưa được cấu hình trong biến môi trường (.env)');
    }

    // 2. Tiến hành kết nối (Đã bỏ hai option lỗi thời để tránh cảnh báo)
    const db = await mongoose.connect(mongoURI);

    // 3. Cập nhật trạng thái dựa trên connection state của mongoose (1 = connected)
    isConnected = db.connections[0].readyState === 1;

    console.log('✅ MongoDB đã kết nối thành công mới');
    return true;
  } catch (error) {
    console.error('❌ Kết nối MongoDB thất bại:', error.message);
    
    // KHÔNG DÙNG process.exit(1) trên Vercel vì nó sẽ làm sập toàn bộ instance Serverless
    // Thay vào đó, throw lỗi để Express middleware xử lý
    throw error;
  }
};

export default connectDB;