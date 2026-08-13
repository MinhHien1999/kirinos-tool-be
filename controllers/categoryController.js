import * as categoryService from '../services/category.service.js';
// 🟢 Import hàm helper dùng chung để xử lý file từ RAM nhị phân
import { uploadSingleToCloudinary } from '../utils/helpers.js';  

// ==========================================
// --- CÁC HÀM LẤY DỮ LIỆU (GET) ---
// ==========================================

// Get all categories with pagination and filters
export const getAllCategories = async (req, res) => {
  try {
    // Ép kiểu các tham số query từ URL
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';

    // Gọi đến service lấy dữ liệu danh mục
    const { total, categories, totalPages, currentPage } = await categoryService.getAllCategories({
      search,
      page,
      limit,
    });

    // Trả về JSON theo đúng chuẩn response của hệ thống
    return res.status(200).json({
      success: true,
      message: 'Fetched categories successfully',
      data: {
        categories,
        pagination: {
          currentPage,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasMore: currentPage < totalPages, // 🟢 Bổ sung cờ hasMore tiện cho Infinite Scroll ở Frontend
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllCategories controller:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi hệ thống khi tải danh mục sản phẩm',
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
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

// Create category
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent, image } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Category name and slug are required',
      });
    }

    // Mặc định lấy giá trị chuỗi gửi từ body nếu có
    let imageUrl = image;

    // 🟢 Nếu có file ảnh danh mục đính kèm qua form-data, tiến hành stream lên Cloudinary
    if (req.file) {
      imageUrl = await uploadSingleToCloudinary(req.file, 'categories');
    }

    const newCategory = await categoryService.createCategory({
      name,
      slug,
      description,
      parent,
      image: imageUrl, // Thêm trường ảnh vào service tạo mới
    });

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, parent, image } = req.body;

    const updateData = {
      name,
      slug,
      description,
      parent,
    };

    // Nếu phía client gửi text URL tĩnh
    if (typeof image !== 'undefined' && image !== '') {
      updateData.image = image;
    }

    // 🟢 Nếu có tải lên tệp tin mới, ghi đè ảnh cũ bằng link từ helper stream
    if (req.file) {
      updateData.image = await uploadSingleToCloudinary(req.file, 'categories');
    }

    const category = await categoryService.updateCategory(id, updateData);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.deleteCategory(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};