import Category from '../models/Category.js';

export const getAllCategories = async ({ search, page = 1, limit = 10 }) => {
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  // Ép kiểu dữ liệu về số nguyên đề phòng trường hợp nhận vào chuỗi string từ query
  const currentPage = parseInt(page) || 1;
  const currentLimit = parseInt(limit) || 10;

  const skip = (currentPage - 1) * currentLimit;
  const total = await Category.countDocuments(filter);
  const categories = await Category.find(filter)
    .populate('parent', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(total / currentLimit);

  return { 
    total, 
    categories,
    totalPages,
    currentPage
  };
};

export const getCategoryById = async (id) => {
  return Category.findById(id).populate('parent', 'name slug');
};

export const searchCategories = async (keyword) => {
  return Category.find({
    name: { $regex: keyword, $options: 'i' },
  });
};

export const createCategory = async (categoryData) => {
  const category = new Category(categoryData);
  await category.save();
  return category;
};

export const updateCategory = async (id, categoryData) => {
  return Category.findByIdAndUpdate(id, categoryData, {
    new: true,
    runValidators: true,
  });
};

export const deleteCategory = async (id) => {
  return Category.findByIdAndDelete(id);
};