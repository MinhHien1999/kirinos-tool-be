import mongoose from 'mongoose';

const { Schema } = mongoose;

// 🖼️ Image & Media
// Tách biệt rõ ràng hoặc giữ chung tùy vào logic hiển thị Slider của bạn
const ImageSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['image', 'youtube'],
      default: 'image',
    },
    url: { type: String, required: true },
    isMain: {
      type: Boolean,
      default: false,
      // Setter tự động xử lý khi nhận chuỗi rỗng ""
      set: (val) =>
        val === '' || val === null || val === undefined ? false : Boolean(val),
    },
    public_id: {
      type: String,
      // Không để required: true vì các link video Youtube hoặc ảnh cũ chưa nén sẽ không có trường này
    },
  },
  { _id: false },
);

// 📊 Specs - Giữ nguyên mảng object để khớp với UI mới
const SpecSchema = new Schema(
  {
    label: { type: String, trim: true },
    value: { type: String, trim: true },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    // 🔥 THAY ĐỔI QUAN TRỌNG:
    // Vì dùng TinyMCE nên description phải là String để lưu HTML
    description: {
      type: String,
      default: '',
    },

    images: [ImageSchema],

    // Mảng các thông số kỹ thuật (khớp với giao diện input mới)
    specs: [SpecSchema],

    // 🟢 THÊM MỚI GIÁ BÁN (Number để tính toán và sắp xếp tăng/giảm)
    price: {
      type: Number,
      required: true,
      default: 0, // 0 có thể quy ước hiển thị trên UI là "Liên hệ"
      index: true, // Đánh index để sau này làm bộ lọc theo khoảng giá cực mượt
    },

    // 🟢 THÊM MỚI SỐ LƯỢNG TỒN KHO
    // quantity: {
    //   type: Number,
    //   required: true,
    //   default: 0,
    //   min: [0, 'Số lượng tồn kho không thể âm'],
    // },

    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
  },
  {
    timestamps: true,
  },
);

// 🟢 CẬP NHẬT QUAN TRỌNG: Tạo Text Index thông minh hỗ trợ tìm kiếm Tiếng Việt không dấu
// Đặt default_language là "none" để ép MongoDB chuẩn hóa bỏ dấu (diacritics) khi indexing dữ liệu.
ProductSchema.index(
  { name: 'text' },
  { default_language: 'none', name: 'ProductSearchIndex' },
);

export default mongoose.models.Product ||
  mongoose.model('Product', ProductSchema);
