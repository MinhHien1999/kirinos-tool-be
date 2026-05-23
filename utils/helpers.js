import * as cheerio from 'cheerio';
import cloudinary from '../config/cloudinary.js';

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Tìm kiếm các thẻ <img> chứa ảnh Base64 trong HTML từ TinyMCE, 
 * chuyển đổi sang Buffer để Stream an toàn lên Cloudinary (Tối ưu cho Serverless/Vercel)
 * @param {string} htmlContent - Chuỗi HTML description từ TinyMCE gửi lên
 * @returns {Promise<string>} - Chuỗi HTML đã được thay thế URL Cloudinary
 */
export const processHtmlImages = async (htmlContent) => {
  if (!htmlContent) return '';

  // Nạp chuỗi HTML vào cheerio (false để giữ nguyên không bọc thẻ html/body thừa)
  const $ = cheerio.load(htmlContent, null, false);
  const imageElements = $('img');
  const uploadPromises = [];

  imageElements.each((index, element) => {
    const src = $(element).attr('src');

    // Chỉ lọc và xử lý các chuỗi ảnh Base64 hợp lệ
    if (src && src.startsWith('data:image')) {
      const uploadPromise = new Promise((resolve) => {
        try {
          // 1. Tách phần header và phần dữ liệu mã hóa ra riêng
          const matches = src.match(/^data:image\/([A-Za-z-+]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            return resolve(); // Bỏ qua nếu cấu trúc base64 không đúng định dạng
          }

          const base64Data = matches[2];
          // 2. Chuyển đổi chuỗi base64 thành đối tượng Buffer nhị phân (Tránh lỗi payload quá dài)
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // 3. Sử dụng uploader.upload_stream để đẩy dòng dữ liệu lên Cloudinary
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'product_descriptions', // Thư mục lưu trữ riêng cho ảnh bài viết
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                console.error(`🔴 Lỗi Cloudinary stream tại vị trí hình ảnh ${index}:`, error.message);
              } else if (result && result.secure_url) {
                // Thay thế src cũ bằng url mới an toàn từ Cloudinary
                $(element).attr('src', result.secure_url);
              }
              resolve(); // Hoàn thành tác vụ cho ảnh này
            }
          );

          // Ghi dữ liệu từ buffer vào luồng stream để truyền đi
          uploadStream.end(imageBuffer);

        } catch (err) {
          console.error(`🔴 Lỗi xử lý chuyển đổi ảnh tại vị trí ${index}:`, err.message);
          resolve();
        }
      });

      uploadPromises.push(uploadPromise);
    }
  });

  // Đợi tất cả các tiến trình stream hoàn tất đồng thời
  await Promise.all(uploadPromises);
  return $.html();
};


/**
 * Upload đơn lẻ 1 file ảnh từ RAM lên Cloudinary bằng Stream (Tối ưu cho memoryStorage)
 * @param {Object} file - Đối tượng file từ Multer (req.file)
 * @param {string} folderName - Tên thư mục trên Cloudinary (Mặc định là 'uploads')
 * @returns {Promise<string|null>} - Trả về URL ảnh hoặc null nếu không có file
 */
export const uploadSingleToCloudinary = (file, folderName = 'uploads') => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return resolve(null);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error(`🔴 Lỗi stream ảnh lên thư mục ${folderName}:`, error.message);
          return reject(error);
        }
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Không nhận được URL an toàn từ Cloudinary'));
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};