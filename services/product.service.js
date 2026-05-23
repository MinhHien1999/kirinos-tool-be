import Product from '../models/Product.js';

export const getAllProducts = async ({
  search,
  brand,
  category,
  status,
  page = 1,
  limit = 4,
}) => {
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  if (brand) {
    filter.brand = brand;
  }

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

  // Ép kiểu số để đảm bảo tính toán skip chính xác
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const limitNumber = Math.max(1, parseInt(limit) || 4);
  const skip = (pageNumber - 1) * limitNumber;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate('brand')
      .populate({
        path: 'category',
        populate: {
          path: 'parent',
          select: 'name',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
  ]);

  return {
    total,
    products,
    totalPages: Math.ceil(total / limitNumber),
    currentPage: pageNumber,
    limit: limitNumber,
  };
};

export const getProductById = async (id) => {
  return Product.findById(id)
    .populate('brand')
    .populate({
      path: 'category',
      populate: {
        path: 'parent',
        select: 'name',
      },
    });
};

export const searchProducts = async (keyword) => {
  return Product.find({
    name: { $regex: keyword, $options: 'i' },
  })
    .populate('brand category')
    .limit(20); // Giới hạn số lượng tìm nhanh
};

export const createProduct = async (productData) => {
  // Đảm bảo specs được parse nếu backend nhận từ FormData (dạng string)
  if (typeof productData.specs === 'string') {
    try {
      productData.specs = JSON.parse(productData.specs);
    } catch (e) {
      productData.specs = [];
    }
  }

  const product = new Product(productData);
  await product.save();
  return product.populate('brand category');
};

export const updateProduct = async (id, productData) => {
  // Tương tự create, parse specs nếu cần
  if (typeof productData.specs === 'string') {
    try {
      productData.specs = JSON.parse(productData.specs);
    } catch (e) {
      delete productData.specs; // Không update nếu format sai
    }
  }

  return Product.findByIdAndUpdate(id, productData, {
    new: true,
    runValidators: true,
  }).populate('brand category');
};

export const deleteProduct = async (id) => {
  return Product.findByIdAndDelete(id);
};
