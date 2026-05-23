import * as brandService from '../services/brand.service.js';
// 🟢 Import hàm helper đơn lẻ từ file helper của bạn (Hãy sửa lại đường dẫn file cho đúng)
import { uploadSingleToCloudinary } from '../utils/helpers.js'; 

// ==========================================
// --- CÁC HÀM LẤY DỮ LIỆU (GET) ---
// ==========================================

// Get all brands with pagination and filters
export const getAllBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const { total, brands } = await brandService.getAllBrands({
      search: req.query.search,
      page,
      limit,
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        brands,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      },
      message: 'Fetched brands successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await brandService.getBrandById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// --- CÁC HÀM XỬ LÝ (CREATE/UPDATE/DELETE) ---
// ==========================================

// Create brand
export const createBrand = async (req, res) => {
  try {
    const { name, slug, logo } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Brand name and slug are required',
      });
    }

    // Mặc định lấy link chuỗi văn bản nhận từ body nếu có
    let logoUrl = logo;

    // 🟢 Sử dụng hàm helper: Truyền req.file trực tiếp từ bộ nhớ RAM vào stream của Cloudinary
    if (req.file) {
      logoUrl = await uploadSingleToCloudinary(req.file, 'brands');
    }

    const newBrand = await brandService.createBrand({
      name,
      slug,
      logo: logoUrl,
    });

    res.status(201).json({
      success: true,
      data: newBrand,
      message: 'Brand created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, logo } = req.body;

    const updateData = {
      name,
      slug,
    };

    if (typeof logo !== 'undefined' && logo !== '') {
      updateData.logo = logo;
    }

    // 🟢 Sử dụng hàm helper để cập nhật logo mới thông qua Stream nếu có file tải lên
    if (req.file) {
      updateData.logo = await uploadSingleToCloudinary(req.file, 'brands');
    }

    const brand = await brandService.updateBrand(id, updateData);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
      message: 'Brand updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upload brand logo riêng lẻ
export const uploadBrandLogo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Logo file is required',
      });
    }

    // 🟢 Gọi helper xử lý gọn gàng dữ liệu buffer
    const secureUrl = await uploadSingleToCloudinary(req.file, 'brands');

    const brand = await brandService.updateBrand(id, {
      logo: secureUrl,
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
      image: secureUrl,
      message: 'Brand logo uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandService.deleteBrand(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};