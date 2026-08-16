import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js'; 
import cloudinary from '../config/cloudinary.js';
import crypto from 'crypto';
/**
 * Helper nội bộ (Private) tại tầng Service chịu trách nhiệm dọn dẹp vật lý ảnh trên Cloudinary.
 */
const deleteCloudinaryImages = async (currentImages, imagesToDeleteInput) => {
  if (!imagesToDeleteInput) return (currentImages || []).filter(img => img.type === 'image');

  try {
    const publicIdsToDelete = typeof imagesToDeleteInput === 'string'
      ? JSON.parse(imagesToDeleteInput)
      : imagesToDeleteInput;

    if (!Array.isArray(publicIdsToDelete) || publicIdsToDelete.length === 0) {
      return (currentImages || []).filter(img => img.type === 'image');
    }

    for (const publicId of publicIdsToDelete) {
      if (publicId) {
        console.log(`🗑️ [Cloudinary Storage] Service đang dọn file rác: ${publicId}`);
        await cloudinary.uploader.destroy(publicId);
      }
    }

    return (currentImages || []).filter(
      img => img.type === 'image' && !publicIdsToDelete.includes(img.public_id)
    );
  } catch (error) {
    console.error('🔴 Thất bại trong quá trình dọn dẹp bộ nhớ Cloudinary:', error.message);
    return (currentImages || []).filter(img => img.type === 'image');
  }
};

// ===================================================
// --- CÁC HÀM XỬ LÝ CHÍNH (CHỨA 100% BUSINESS LOGIC) ---
// ===================================================

/**
 * Nghiệp vụ: Tạo sản phẩm mới hoàn chỉnh
 */
export const createProduct = async (productData, uploadedRawImages) => {
  const { name, price, slug, brand, category, description, specs, status, mainImageId, youtubeUrls } = productData;

  // 1. 🟢 XỬ LÝ CHỐNG TRÙNG SLUG (Lấy slug từ FE gửi về để check)
    let finalSlug = slug || '';

    // Kiểm tra nhanh xem slug này đã tồn tại trong database chưa
    const isSlugExists = await Product.findOne({ slug: finalSlug }).lean();

    if (isSlugExists) {
      // Nếu trùng, sinh 2 bytes (4 ký tự hexa ngẫu nhiên, ví dụ: 'a1b2') rồi nối vào đuôi slug của FE
      const randomHash = crypto.randomBytes(2).toString('hex');
      finalSlug = `${finalSlug}-${randomHash}`;
    }

  let isMainAssigned = false;
  const finalImages = (uploadedRawImages || []).map((img) => {
    const isThisMain = mainImageId && img.originalName === mainImageId;
    if (isThisMain) isMainAssigned = true;
    return {
      type: 'image',
      url: img.url,
      public_id: img.public_id,
      isMain: isThisMain
    };
  });

  if (!isMainAssigned && finalImages.length > 0) {
    finalImages[0].isMain = true;
  }

  const rawUrls = Array.isArray(youtubeUrls) ? youtubeUrls : (youtubeUrls ? [youtubeUrls] : []);
  const youtubeEntries = rawUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

  let finalSpecs = specs;
  if (typeof specs === 'string') {
    try { finalSpecs = JSON.parse(specs); } catch { finalSpecs = []; }
  }
  const product = new Product({
    name,
    price,
    slug: finalSlug,
    brand: brand || null,
    category: category || null,
    description,
    status,
    specs: finalSpecs,
    images: [...finalImages, ...youtubeEntries]
  });

  await product.save();
  return product.populate('brand category');
};

/**
 * Nghiệp vụ: Cập nhật sản phẩm hiện tại
 */
export const updateProduct = async (id, rawData, newUploadedRawImages) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  // 🟢 Khắc phục: Giữ lại mảng video YouTube cũ của sản phẩm trước khi bị hàm delete lọc mất
  const oldYoutubeEntries = (product.images || []).filter(img => img.type === 'youtube');

  // Gửi lệnh dọn dẹp các ảnh cần xóa trên Cloudinary
  const oldPhotos = await deleteCloudinaryImages(product.images, rawData.imagesToDelete);

  let isMainAssigned = false;
  const targetMainId = rawData.mainImageId;

  const finalOldPhotos = oldPhotos.map((img) => {
    const plainImg = typeof img.toObject === 'function' ? img.toObject() : img;
    const isThisMain = targetMainId && String(plainImg.public_id) === String(targetMainId);
    if (isThisMain) isMainAssigned = true;
    return {
      type: plainImg.type || 'image',
      url: plainImg.url,
      public_id: plainImg.public_id,
      isMain: isThisMain
    };
  });

  const finalNewPhotos = (newUploadedRawImages || []).map((img) => {
    const isThisMain = targetMainId && img.originalName === targetMainId;
    if (isThisMain) isMainAssigned = true;
    return {
      type: 'image',
      url: img.url,
      public_id: img.public_id,
      isMain: isThisMain
    };
  });

  if (!isMainAssigned) {
    if (finalOldPhotos.length > 0) finalOldPhotos[0].isMain = true;
    else if (finalNewPhotos.length > 0) finalNewPhotos[0].isMain = true;
  }

  // Xử lý mảng video YouTube mới truyền lên từ form cập nhật (nếu có)
  const rawUrls = Array.isArray(rawData.youtubeUrls) ? rawData.youtubeUrls : (rawData.youtubeUrls ? [rawData.youtubeUrls] : []);
  const newYoutubeEntries = rawUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

  let finalSpecs = rawData.specs;
  if (typeof rawData.specs === 'string') {
    try { finalSpecs = JSON.parse(rawData.specs); } catch { finalSpecs = product.specs; }
  }

  product.name = rawData.name;
  product.price = rawData.price;
  product.slug = rawData.slug;
  product.brand = rawData.brand || null;
  product.category = rawData.category || null;
  product.description = rawData.description;
  product.status = rawData.status;
  product.specs = finalSpecs;
  
  // 🟢 Khắc phục: Gộp cả ảnh cũ, ảnh mới, video mới và bảo toàn video cũ
  product.images = [...finalOldPhotos, ...finalNewPhotos, ...oldYoutubeEntries, ...newYoutubeEntries];

  await product.save();
  return product.populate('brand category');
};

/**
 * Nghiệp vụ: Upload lẻ bổ sung ảnh
 */
export const uploadProductImages = async (id, newUploadedRawImages) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  const finalNewPhotos = (newUploadedRawImages || []).map(img => ({
    type: 'image',
    url: img.url,
    public_id: img.public_id,
    isMain: false 
  }));

  product.images = [...(product.images || []), ...finalNewPhotos];
  await product.save();
  return product.populate('brand category');
};

/**
 * Nghiệp vụ: Xóa toàn diện sản phẩm
 */
export const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  const allPublicIds = (product.images || [])
    .filter((img) => img.type === 'image' && img.public_id)
    .map((img) => img.public_id);

  if (allPublicIds.length > 0) {
    await deleteCloudinaryImages(product.images, allPublicIds);
  }

  return Product.findByIdAndDelete(id);
};

// ==========================================
// --- CÁC HÀM TRUY VẤN DỮ LIỆU SẠCH (GET) ---
// ==========================================

/**
 * 🟢 Lấy danh sách sản phẩm dựa theo Category Slug (Có phân trang + Đã vá lỗi cú pháp)
 */
export const getProductsByCategorySlug = async (categorySlug, page = 1, limit = 12) => {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const limitNumber = Math.max(1, parseInt(limit, 10) || 12);
  const skip = (pageNumber - 1) * limitNumber;

  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) return null;

  const subCategories = await Category.find({ parent: category._id }).select('_id').sort({ name: 1 }).lean();

  const categoryIds = [category._id];
  if (subCategories.length > 0) {
    subCategories.forEach(sub => categoryIds.push(sub._id));
  } // 🟢 Đã sửa: Thêm dấu đóng ngoặc nhọn bị thiếu ở đây giúp code chạy mượt mà

  const filter = { category: { $in: categoryIds } };

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate('brand')
      .populate({
        path: 'category',
        populate: { path: 'parent', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean() // Tối ưu hóa bộ nhớ cho Client đọc nhanh
  ]);

  return {
    category,
    products,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      limit: limitNumber,
    }
  };
};

/**
 * 🟢 Nghiệp vụ: Lấy danh sách sản phẩm theo Thương hiệu phẳng (Có phân trang)
 * Tối ưu vận tốc bằng .lean() và Promise.all
 */
export const getProductsByBrandSlug = async (brandSlug, page = 1, limit = 12) => {
  try {
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNumber - 1) * limitNumber;

    // 1. Đi tìm thông tin Brand thô bằng slug
    const brand = await Brand.findOne({ slug: brandSlug }).lean();
    if (!brand) return null; // Trả về null để Controller báo phản hồi 404 Not Found

    // 2. Vì không có brand con, filter đánh trực tiếp vào duy nhất ID của brand này
    const filter = { brand: brand._id };

    // 3. Thực hiện đếm tổng và lọc dữ liệu sản phẩm song song
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('brand')
        .populate({
          path: 'category',
          populate: { path: 'parent', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean() // Giúp nén bộ nhớ RAM phản hồi cho client
    ]);

    // 4. Trả kết quả đồng bộ dữ liệu với Frontend
    return {
      brand,
      products,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      }
    };

  } catch (error) {
    console.error(`🔴 Lỗi lấy danh sách sản phẩm theo Brand Slug [${brandSlug}]:`, error.message);
    throw error;
  }
};

export const getAllProducts = async ({ search, brand, category, status, page = 1, limit = 4 }) => {
  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (brand) filter.brand = brand;
  if (category) filter.category = category;
  if (status) filter.status = status;

  const pageNumber = Math.max(1, parseInt(page) || 1);
  const limitNumber = Math.max(1, parseInt(limit) || 4);
  const skip = (pageNumber - 1) * limitNumber;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .populate('brand')
      .populate({
        path: 'category',
        populate: { path: 'parent', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(), // 🟢 Tối ưu thêm lean() tương đồng để tăng tốc hàm fetch tổng quan
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
  return Product.findById(id).populate('brand').populate({
    path: 'category',
    populate: { path: 'parent', select: 'name' },
  }).lean();
};

export const searchProducts = async (keyword) => {
  return Product.find({ name: { $regex: keyword, $options: 'i' } })
    .populate('brand category')
    .limit(20)
    .lean();
};

/**
 * 🟢 SERVICE: Lấy danh sách sản phẩm phân trang dành riêng cho CLIENT
 * - status: Nhận giá trị cấu hình trực tiếp từ code của Controller.
 * - select: Chỉ lấy đúng 4 trường cốt lõi (name, images, slug, status).
 */
export const getProductsForClient = async ({ status, page = 1, limit = 12 }) => {
  try {
    const filter = {};

    // Nếu status được truyền vào (dạng chuỗi hoặc object cấu hình), ta gán vào filter
    if (status) {
      filter.status = status;
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNumber - 1) * limitNumber;

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select('name images slug status') // Tối ưu dung lượng tối đa
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
    ]);

    return {
      data: products,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber,
      },
    };
  } catch (error) {
    console.error('🔴 [Service Error] Lỗi tải danh sách sản phẩm phía Client:', error.message);
    throw error;
  }
};
/**
 * 🔍 SERVICE: Tìm kiếm nhanh (Gợi ý dropdown) phía CLIENT
 * - Giới hạn cứng: Chỉ lấy tối đa 5 sản phẩm mới nhất, không phân trang.
 * - Trạng thái (status): Quét cả mặt hàng 'in_stock' và 'out_of_stock' cấu hình trực tiếp.
 * - Dữ liệu tối giản: Chỉ lấy đúng name, images, slug.
 * - Lưu ý: Từ khóa `keyword` bắt buộc phải được đảm bảo hợp lệ trước khi gọi hàm này.
 */
export const getSearchSuggestionsForClient = async (keyword) => {
  try {
    const cleanKeyword = keyword.trim();
    
    // Cấu hình trạng thái cứng trong code (quét cả mặt hàng còn và hết)
    const baseFilter = { status: { $in: ['in_stock', 'out_of_stock'] } };

    // Dựng bộ lọc Giai đoạn 1: Dùng toán tử Text Index tìm kiếm nhanh
    let filter = { 
      ...baseFilter,
      $text: { $search: cleanKeyword }
    };

    const selectFields = 'name images slug'; // Chọn đúng 3 trường cần thiết, bỏ hoàn toàn populate
    const limitNumber = 6; // Cố định lấy đúng 6 sản phẩm phục vụ dropdown kết quả nhanh

    // Thực hiện truy vấn Giai đoạn 1
    let [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(selectFields)
        .sort({ createdAt: -1 }) // Lấy hàng mới nhất lên trước
        .limit(limitNumber)
        .lean()
    ]);

    // 🔥 GIAI ĐOẠN 2 (Fallback): Nếu Text Index không trả ra kết quả, quay về nới lỏng bằng $regex
    if (products.length === 0) {
      const words = cleanKeyword.split(/\s+/).filter(w => w.length > 0);
      
      if (words.length > 0) {
        filter = { 
          ...baseFilter,
          $and: words.map(word => ({
            name: { $regex: word, $options: 'i' }
          }))
        };

        [total, products] = await Promise.all([
          Product.countDocuments(filter),
          Product.find(filter)
            .select(selectFields)
            .sort({ createdAt: -1 })
            .limit(limitNumber)
            .lean()
        ]);
      }
    }

    // Trả về cấu trúc dữ liệu siêu nhẹ phục vụ thanh Header Client
    return {
      data: products,
      totalItems: total
    };

  } catch (error) {
    console.error(`🔴 [Service Error] Lỗi tìm kiếm nhanh phía Client với từ khóa [${keyword}]:`, error.message);
    throw error;
  }
};
/**
 * 🔍 SERVICE: Tìm kiếm ĐẦY ĐỦ có PHÂN TRANG dành cho Trang Kết Quả Tổng (/search)
 * - Nhận đầy đủ tham số page và limit từ Frontend gửi lên.
 * - Trả ra toàn bộ sản phẩm khớp từ khóa dựa theo trang hiện tại.
 */
export const searchProductsFullPage = async ({ keyword, page = 1, limit = 12 }) => {
  try {
    const cleanKeyword = keyword.trim();
    const baseFilter = { status: { $in: ['in_stock', 'out_of_stock'] } };

    let filter = { ...baseFilter, $text: { $search: cleanKeyword } };

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 12); // Mặc định 12 sản phẩm/trang giống trang danh mục
    const skip = (pageNumber - 1) * limitNumber;

    // Chỉ select các trường cần thiết để dựng Card Sản phẩm cho nhẹ dữ liệu
    const selectFields = 'name images slug status'; 

    let [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(selectFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean()
    ]);

    // Fallback sang $regex nếu Text Index không ra kết quả
    if (products.length === 0) {
      const words = cleanKeyword.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        filter = { 
          ...baseFilter,
          $and: words.map(word => ({ name: { $regex: word, $options: 'i' } }))
        };

        [total, products] = await Promise.all([
          Product.countDocuments(filter),
          Product.find(filter)
            .select(selectFields)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .lean()
        ]);
      }
    }

    return {
      data: products,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        limit: limitNumber
      }
    };
  } catch (error) {
    console.error(`🔴 Lỗi tìm kiếm trang tổng với từ khóa [${keyword}]:`, error.message);
    throw error;
  }
};