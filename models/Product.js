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
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

// 📊 Specs - Giữ nguyên mảng object để khớp với UI mới
const SpecSchema = new Schema(
  {
    label: { type: String, trim: true },
    value: { type: String, trim: true },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: { type: String, required: true, unique: true, lowercase: true },

    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
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

    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock'],
      default: 'in_stock',
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm sản phẩm nhanh hơn theo tên
ProductSchema.index({ name: 'text' });

export default mongoose.models.Product ||
  mongoose.model('Product', ProductSchema);