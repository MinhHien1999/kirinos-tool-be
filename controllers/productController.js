import * as productService from '../services/product.service.js';
import cloudinary from '../config/cloudinary.js';
import { processHtmlImages } from '../utils/helpers.js';

/**
 * Helper kỹ thuật hạ tầng mạng: Đọc dữ liệu từ RAM buffer ném trực tiếp lên Stream Cloudinary.
 * Hàm này đặt tại Controller vì nó liên quan trực tiếp đến kiến trúc HTTP Multipart (`req.files`).
 */
const uploadToCloudinary = async (files) => {
  if (!files || !files.length) return [];

  return await Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'products', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve({
              url: result.secure_url,
              public_id: result.public_id,
              originalName: file.originalname, // Giữ chìa khóa tên file thô gửi xuống Service đối chiếu
            });
          },
        );
        uploadStream.end(file.buffer);
      });
    }),
  );
};

// ==========================================
// --- ĐIỀU HƯỚNG HTTP & PHẢN HỒI CLIENT ---
// ==========================================

export const createProduct = async (req, res) => {
  try {
    const { name, slug, brand, category } = req.body;

    // 1. Kiểm tra nhanh tính toàn vẹn dữ liệu mạng thô sơ
    if (!name || !slug || !brand || !category) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // 2. Chuyển đổi dữ liệu hạ tầng kỹ thuật mạng (Dịch ảnh TinyMCE + Upload file thô)
    req.body.description = req.body.description
      ? await processHtmlImages(req.body.description)
      : '';
    const uploadedRawImages = await uploadToCloudinary(req.files);

    // 3. Đẩy toàn bộ payload sạch xuống tầng Nghiệp vụ xử lý logic lưu trữ
    const newProduct = await productService.createProduct(
      req.body,
      uploadedRawImages,
    );

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error('🔴 [Controller Error] Thêm mới sản phẩm thất bại:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Chuyển đổi dữ liệu hạ tầng
    req.body.description = req.body.description
      ? await processHtmlImages(req.body.description)
      : undefined;
    const newUploadedRawImages = await uploadToCloudinary(req.files);

    // 2. Trao quyền quyết định giải bài toán logic sửa đổi/phân bổ cho Service
    const result = await productService.updateProduct(
      id,
      req.body,
      newUploadedRawImages,
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('🔴 [Controller Error] Cập nhật sản phẩm thất bại:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No files uploaded' });
    }

    const newUploadedRawImages = await uploadToCloudinary(req.files);
    const result = await productService.uploadProductImages(
      id,
      newUploadedRawImages,
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('🔴 [Controller Error] Upload lẻ ảnh thất bại:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 4;

    const result = await productService.getAllProducts({
      search: req.query.search,
      brand: req.query.brand,
      category: req.query.category,
      status: req.query.status,
      page,
      limit,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const products = await productService.searchProducts(req.query.keyword);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
