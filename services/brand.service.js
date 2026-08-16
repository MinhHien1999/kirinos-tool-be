import Brand from '../models/Brand.js';

export const getAllBrands = async ({ search, page = 1, limit = 10 }) => {
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const currentPage = parseInt(page) || 1;
  const currentLimit = parseInt(limit) || 10;

  const skip = (currentPage - 1) * currentLimit;
  const total = await Brand.countDocuments(filter);
  const brands = await Brand.find(filter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(currentLimit);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(total / currentLimit);

  return { 
    total, 
    brands,
    totalPages,
    currentPage
  };
};

export const getBrandById = async (id) => {
  return Brand.findById(id);
};

export const searchBrands = async (keyword) => {
  return Brand.find({
    name: { $regex: keyword, $options: 'i' },
  });
};

export const createBrand = async (brandData) => {
  const brand = new Brand(brandData);
  await brand.save();
  return brand;
};

export const updateBrand = async (id, brandData) => {
  return Brand.findByIdAndUpdate(id, brandData, {
    new: true,
    runValidators: true,
  });
};

export const deleteBrand = async (id) => {
  return Brand.findByIdAndDelete(id);
};
