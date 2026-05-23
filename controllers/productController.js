import cloudinary from '../config/cloudinary.js';
import * as productService from '../services/product.service.js';
// 🟢 Gọi trực tiếp hàm helper đã viết lại bằng Stream tối ưu của bạn
import { processHtmlImages } from '../utils/helpers.js'; 

// Helper parse JSON an toàn
const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

// Upload danh sách ảnh chính của sản phẩm thông qua Stream (Dành cho memoryStorage)
const uploadToCloudinary = async (files) => {
  if (!files || !files.length) return [];
  
  return await Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        // Khởi tạo luồng stream đẩy trực tiếp dữ liệu nhị phân từ RAM lên Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('🔴 Lỗi stream ảnh chính lên Cloudinary:', error);
              return reject(error);
            }
            if (result && result.secure_url) {
              resolve({ type: 'image', url: result.secure_url });
            } else {
              reject(new Error('Không nhận được URL bảo mật từ Cloudinary'));
            }
          }
        );

        // Đổ dữ liệu buffer từ bộ nhớ RAM vào luồng và đóng stream
        uploadStream.end(file.buffer);
      });
    })
  );
};


// ==========================================
// --- CÁC HÀM LẤY DỮ LIỆU (GET) ---
// ==========================================

export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 4;

    const { total, products, totalPages } = await productService.getAllProducts({
      search: req.query.search,
      brand: req.query.brand,
      category: req.query.category,
      status: req.query.status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: totalPages || Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) return res.status(400).json({ success: false, message: 'Keyword is required' });
    const products = await productService.searchProducts(keyword);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================================
// --- CÁC HÀM XỬ LÝ (CREATE/UPDATE/DELETE) ---
// ==========================================

export const createProduct = async (req, res) => {
  try {
    const { name, slug, brand, category, description, specs, status } = req.body;
    if (!name || !slug || !brand || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 1. Gọi hàm xử lý ảnh từ TinyMCE thông qua file Helper bạn vừa import ở trên đầu
    const cleanDescription = await processHtmlImages(description);

    // 2. Upload danh sách ảnh chính sản phẩm thông qua Stream từ RAM (.buffer)
    const uploadedImages = await uploadToCloudinary(req.files);
    
    const rawYoutubeUrls = Array.isArray(req.body.youtubeUrls) ? req.body.youtubeUrls : (req.body.youtubeUrls ? [req.body.youtubeUrls] : []);
    const youtubeEntries = rawYoutubeUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

    const newProduct = await productService.createProduct({
      name, 
      slug, 
      brand, 
      category, 
      description: cleanDescription, // Lưu chuỗi nội dung mô tả sạch
      images: [...uploadedImages, ...youtubeEntries],
      specs: parseJsonField(specs),
      status,
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // 1. Gọi hàm xử lý ảnh nhúng TinyMCE từ file Helper khi cập nhật thông tin mô tả
    const cleanDescription = await processHtmlImages(req.body.description);

    // 2. Upload các ảnh chính sản phẩm được bổ sung mới
    const newUploadedImages = await uploadToCloudinary(req.files);
    
    const rawYoutubeUrls = Array.isArray(req.body.youtubeUrls) ? req.body.youtubeUrls : (req.body.youtubeUrls ? [req.body.youtubeUrls] : []);
    const youtubeEntries = rawYoutubeUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

    const oldPhotos = (product.images || []).filter(img => img.type === 'image');

    const updateData = {
      name: req.body.name,
      slug: req.body.slug,
      brand: req.body.brand,
      category: req.body.category,
      description: cleanDescription,
      specs: parseJsonField(req.body.specs),
      status: req.body.status,
      images: [...oldPhotos, ...newUploadedImages, ...youtubeEntries]
    };

    const result = await productService.updateProduct(id, updateData);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const newImages = await uploadToCloudinary(req.files);
    product.images = [...(product.images || []), ...newImages];
    await product.save();
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};