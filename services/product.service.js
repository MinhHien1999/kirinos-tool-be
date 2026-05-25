import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';

/**
 * Helper nội bộ (Private) tại tầng Service chịu trách nhiệm dọn dẹp vật lý ảnh trên Cloudinary.
 * Đây là logic nghiệp vụ bảo trì dữ liệu sạch.
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
  const { name, slug, brand, category, description, specs, status, mainImageId, youtubeUrls } = productData;

  // 1. Logic nghiệp vụ: Đồng bộ hóa cờ ảnh chính (isMain) 🌟
  let isMainAssigned = false;
  const finalImages = uploadedRawImages.map((img) => {
    const isThisMain = mainImageId && img.originalName === mainImageId;
    if (isThisMain) isMainAssigned = true;
    return {
      type: 'image',
      url: img.url,
      public_id: img.public_id,
      isMain: isThisMain
    };
  });

  // Dự phòng: Tự động chọn tấm đầu tiên làm ảnh chính nếu không khớp tấm nào
  if (!isMainAssigned && finalImages.length > 0) {
    finalImages[0].isMain = true;
  }

  // 2. Logic nghiệp vụ: Cấu trúc hóa mảng video YouTube
  const rawUrls = Array.isArray(youtubeUrls) ? youtubeUrls : (youtubeUrls ? [youtubeUrls] : []);
  const youtubeEntries = rawUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

  // 3. Logic nghiệp vụ: Ép kiểu an toàn cho specs
  let finalSpecs = specs;
  if (typeof specs === 'string') {
    try { finalSpecs = JSON.parse(specs); } catch { finalSpecs = []; }
  }

  // 4. Lưu xuống Database thông qua Mongoose Model
  const product = new Product({
    name,
    slug,
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

  // 1. Logic nghiệp vụ: Gửi lệnh dọn dẹp các ảnh cần xóa trên Cloudinary
  const oldPhotos = await deleteCloudinaryImages(product.images, rawData.imagesToDelete);

  // 2. Logic nghiệp vụ: Tái phân bổ cờ ngôi sao (isMain) cho cả ảnh cũ và ảnh mới bổ sung
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

  const finalNewPhotos = newUploadedRawImages.map((img) => {
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

  // 3. Logic nghiệp vụ: Xử lý video YouTube
  const rawUrls = Array.isArray(rawData.youtubeUrls) ? rawData.youtubeUrls : (rawData.youtubeUrls ? [rawData.youtubeUrls] : []);
  const youtubeEntries = rawUrls.filter(u => u?.trim()).map(url => ({ type: 'youtube', url: url.trim() }));

  // 4. Logic nghiệp vụ: Kiểm tra ép kiểu specs
  let finalSpecs = rawData.specs;
  if (typeof rawData.specs === 'string') {
    try { finalSpecs = JSON.parse(rawData.specs); } catch { finalSpecs = product.specs; }
  }

  // 5. Đồng bộ hóa các thuộc tính thay đổi trực tiếp vào Object Model
  product.name = rawData.name;
  product.slug = rawData.slug;
  product.brand = rawData.brand || null;
  product.category = rawData.category || null;
  product.description = rawData.description;
  product.status = rawData.status;
  product.specs = finalSpecs;
  product.images = [...finalOldPhotos, ...finalNewPhotos, ...youtubeEntries];

  await product.save();
  return product.populate('brand category');
};

/**
 * Nghiệp vụ: Upload lẻ bổ sung ảnh (Giữ lại để không crash import router cũ của bạn)
 */
export const uploadProductImages = async (id, newUploadedRawImages) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Product not found');

  const finalNewPhotos = newUploadedRawImages.map(img => ({
    type: 'image',
    url: img.url,
    public_id: img.public_id,
    isMain: false // Mặc định ảnh upload lẻ thêm vào sau không chiếm ngôi sao ảnh chính
  }));

  product.images = [...(product.images || []), ...finalNewPhotos];
  await product.save();
  return product.populate('brand category');
};

/**
 * Nghiệp vụ: Xóa toàn diện sản phẩm (Quét dọn Cloudinary trước khi xóa DB)
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
  return Product.findById(id).populate('brand').populate({
    path: 'category',
    populate: { path: 'parent', select: 'name' },
  });
};

export const searchProducts = async (keyword) => {
  return Product.find({ name: { $regex: keyword, $options: 'i' } })
    .populate('brand category')
    .limit(20);
};