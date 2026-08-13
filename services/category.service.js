import Category from '../models/Category.js';

export const getAllCategories = async ({ search, page = 1, limit = 10 }) => {
  try {
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    } else {
      // Chỉ lấy danh mục cha gốc
      filter.$or = [
        { parent: null },
        { parent: { $exists: false } }
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;

    const total = await Category.countDocuments(filter);

    // 1. Lấy danh sách danh mục cha
    const parentCategories = await Category.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(currentLimit)
      .lean();

    // 2. Query lấy danh mục con cho từng danh mục cha
    const categoriesWithChildren = await Promise.all(
      parentCategories.map(async (parentCat) => {
        const children = await Category.find({ parent: parentCat._id })
          .select('name slug parent')
          .sort({ name: 1 })
          .lean();

        return {
          ...parentCat,
          children: children || [], // Gắn danh sách danh mục con
        };
      })
    );

    const totalPages = Math.ceil(total / currentLimit) || 1;

    return {
      total,
      categories: categoriesWithChildren,
      totalPages,
      currentPage,
    };
  } catch (error) {
    throw new Error(`Lỗi Service Category: ${error.message}`);
  }
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