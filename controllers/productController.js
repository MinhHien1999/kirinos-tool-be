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
    const { name, price, slug, brand, category } = req.body;

    // 1. Kiểm tra tính toàn vẹn các trường thông tin bắt buộc
    if (!name?.trim() || !slug?.trim() || !brand || !category) {
      return res.status(400).json({
        success: false,
        message:
          'Vui lòng điền đầy đủ các thông tin bắt buộc (Tên, Slug, Thương hiệu, Danh mục)',
      });
    }

    // 2. 🟢 Validate & Parse giá tiền (price) an toàn
    let parsedPrice = 0;
    if (price !== undefined && price !== null && price !== '') {
      // Lọc bỏ tất cả ký tự không phải số (ví dụ: "1.000.000 đ" -> "1000000")
      const cleanPriceStr =
        typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
      parsedPrice = Number(cleanPriceStr);

      // Bắt lỗi nếu nhập số âm hoặc chuỗi không hợp lệ
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá sản phẩm không hợp lệ (phải là số lớn hơn 0)',
        });
      }
    }

    // 3. Chuyển đổi dữ liệu hạ tầng kỹ thuật mạng (Dịch ảnh TinyMCE + Upload file thô)
    const processedDescription = req.body.description
      ? await processHtmlImages(req.body.description)
      : '';
    const uploadedRawImages = await uploadToCloudinary(req.files);

    // 4. Đóng gói Payload sạch sẽ trước khi gửi xuống Service
    const productData = {
      ...req.body,
      name: name.trim(),
      slug: slug.trim(),
      price: parsedPrice, // 👈 Luôn là Number thuần túy (ví dụ: 1000000 hoặc 0)
      description: processedDescription,
    };

    // 5. Đẩy toàn bộ payload sạch xuống tầng Nghiệp vụ xử lý logic lưu trữ
    const newProduct = await productService.createProduct(
      productData,
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
    const { name, price, slug, description } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID sản phẩm cần cập nhật',
      });
    }

    // 1. 🟢 VALIDATE PRICE NẾU FE CÓ TRUYỀN LÊN (BẮT BUỘC PHẢI > 0)
    let parsedPrice;
    if (price !== undefined && price !== null) {
      // Lọc bỏ ký tự không phải số
      const cleanPriceStr =
        typeof price === 'string' ? price.replace(/[^0-9]/g, '') : price;
      parsedPrice = Number(cleanPriceStr);

      // 🛑 Chặn nếu rỗng, không phải số HOẶC nhỏ hơn/bằng 0
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá sản phẩm không hợp lệ (phải là số nguyên lớn hơn 0)',
        });
      }
    }

    // 2. Chuyển đổi dữ liệu hạ tầng
    const processedDescription =
      description !== undefined
        ? description
          ? await processHtmlImages(description)
          : ''
        : undefined;

    const newUploadedRawImages = await uploadToCloudinary(req.files);

    // 3. Đóng gói Payload sạch
    const productData = {
      ...req.body,
      ...(name !== undefined && { name: name.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(parsedPrice !== undefined && { price: parsedPrice }),
      ...(processedDescription !== undefined && {
        description: processedDescription,
      }),
    };

    // 4. Đẩy xuống Service xử lý
    const result = await productService.updateProduct(
      id,
      productData,
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
export const getProductsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Lấy thông tin phân trang từ query string (mặc định page=1, limit=12 cho lưới sản phẩm)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;

    // 2. Gọi tầng Service xử lý logic MongoDB (Mongoose)
    const result = await productService.getProductsByCategorySlug(
      slug,
      page,
      limit,
    );

    // 3. Nếu Service trả về null (Không tồn tại category với slug này)
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục sản phẩm không tồn tại.',
      });
    }
    // 4. Phản hồi client với cấu trúc JSON chuẩn REST API thống nhất của hệ thống
    res.status(200).json({
      success: true,
      data: {
        category: result.category,
        products: result.products,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error(
      '🔴 [Controller Error] Lấy sản phẩm theo danh mục thất bại:',
      error,
    );
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByBrandSlug = async (req, res) => {
  console.log(
    '🔍 [Controller] getProductsByBrandSlug called with params:',
    req.params,
    'and query:',
    req.query,
  );
  try {
    const { slug } = req.params;
    const { page, limit } = req.query; // Lấy tham số phân trang từ Query String (ví dụ: ?page=2&limit=12)

    // 1. Kiểm tra tham số bắt buộc
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Tham số brand slug là bắt buộc.',
      });
    }

    // 2. Gọi sang tầng Service xử lý logic nghiệp vụ và truy vấn MongoDB Atlas
    const result = await productService.getProductsByBrandSlug(
      slug,
      page,
      limit,
    );

    // 3. Nếu Service trả về null (Nghĩa là slug thương hiệu này không tồn tại trong DB)
    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thương hiệu có slug là: "${slug}"`,
      });
    }

    // 4. Trả dữ liệu sạch về cho Frontend Next.js xử lý hiển thị giao diện
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm theo thương hiệu thành công.',
      data: {
        brand: result.brand,
        products: result.products,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error(
      `🔴 [Controller Error] Lỗi tại getProductsByBrandSlug:`,
      error.message,
    );

    // Phản hồi lỗi hệ thống về phía Client một cách an toàn
    return res.status(500).json({
      success: false,
      message:
        'Đã xảy ra lỗi hệ thống khi lấy danh sách sản phẩm theo thương hiệu.',
      error: error.message,
    });
  }
};
export const searchProductsForAdmin = async (req, res) => {
  try {
    const products = await productService.searchProducts(req.query.keyword);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🎮 CONTROLLER: Tìm kiếm nhanh sản phẩm phía CLIENT
 * - Kiểm tra (Validate) từ khóa ngay tại đây: Nếu trống, trả về mảng rỗng ngay lập tức để tiết kiệm tài nguyên.
 * - Loại bỏ hoàn toàn page, limit cồng kềnh (vì phía service đã ép cứng lấy 5 sản phẩm).
 */
export const getSearchSuggestionsForClient = async (req, res) => {
  try {
    const { keyword } = req.query;

    // 🔥 1. Thực hiện kiểm tra từ khóa tại tầng Controller
    // Nếu không gõ hoặc chỉ gõ toàn khoảng trắng, chặn truy vấn và trả về kết quả trống luôn
    if (!keyword || !keyword.trim()) {
      return res.status(200).json({
        success: true,
        data: [],
        totalItems: 0,
      });
    }

    // 🟢 2. Từ khóa hợp lệ -> Gọi hàm Service bóc tách sạch sẽ (chỉ truyền duy nhất keyword)
    const result = await productService.getSearchSuggestionsForClient(keyword);

    // 🟢 3. Trải kết quả phẳng ra JSON trả về cho Frontend nhận { success: true, data: [...], totalItems: X }
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getSearchProductsFullPage = async (req, res) => {
  try {
    const { keyword, page, limit } = req.query;

    if (!keyword || !keyword.trim()) {
      return res
        .status(200)
        .json({ success: true, data: [], pagination: { totalItems: 0 } });
    }

    const result = await productService.searchProductsFullPage({
      keyword,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12, // Trang tổng hiển thị nhiều sản phẩm
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * 🎮 CONTROLLER: Điều phối danh sách sản phẩm phía CLIENT
 * - Thiết lập trạng thái status cố định ngay trong code để bảo mật.
 */
export const getProductsForClient = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;

    // 🛠️ CẤU HÌNH TRẠNG THÁI TRONG CODE (Chọn 1 trong 2 cách sau):

    // Cách A: Nếu bạn muốn hiển thị cả hàng CÒN HÀNG và HẾT HÀNG ra cho khách xem
    const statusFilter = { $in: ['in_stock', 'out_of_stock'] };

    // Cách B: Nếu bạn chỉ muốn khách nhìn thấy những hàng đang CÒN HÀNG (Ẩn hẳn hàng hết)
    // const statusFilter = 'in_stock';

    const result = await productService.getProductsForClient({
      status: statusFilter, // Truyền biến đã thiết lập cố định trong code
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
