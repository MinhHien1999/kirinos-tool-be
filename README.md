# Kirinos Tool Backend

Backend API cho ứng dụng Kirinos Tool được xây dựng bằng **Express.js** với **MongoDB** (Mongoose) theo mô hình **MVC**.

## 📁 Cấu trúc dự án

```
kirinos-tool-be/
├── config/
│   └── database.js         # Cấu hình kết nối MongoDB
├── models/
│   ├── Brand.js           # Schema thương hiệu
│   ├── Product.js         # Schema sản phẩm
│   ├── Category.js        # Schema danh mục
│   ├── Invoice.js         # Schema hóa đơn
│   ├── InvoiceDetail.js   # Schema chi tiết hóa đơn
│   └── index.js           # Export tất cả models
├── controllers/
│   ├── brandController.js      # Logic xử lý thương hiệu
│   ├── productController.js    # Logic xử lý sản phẩm
│   ├── categoryController.js   # Logic xử lý danh mục
│   └── invoiceController.js    # Logic xử lý hóa đơn
├── routes/
│   ├── brandRoutes.js      # Route thương hiệu
│   ├── productRoutes.js    # Route sản phẩm
│   ├── categoryRoutes.js   # Route danh mục
│   └── invoiceRoutes.js    # Route hóa đơn
├── middlewares/
│   └── errorHandler.js     # Xử lý lỗi và logging
├── utils/
│   └── helpers.js          # Hàm tiện ích
├── server.js               # File khởi động chính
├── package.json            # Dependencies
└── .env.example            # Biến môi trường mẫu
```

## 🚀 Cài đặt

1. **Cài đặt dependencies**

```bash
npm install
```

2. **Tạo file .env**

```bash
cp .env.example .env
```

3. **Cấu hình MongoDB**
   Cập nhật `MONGODB_URI` trong file `.env`:

```
MONGODB_URI=mongodb://localhost:27017/kirinos-tool
PORT=3000
NODE_ENV=development
```

4. **Khởi động server**

```bash
npm run dev
```

## 📚 API Endpoints

### Brands (Thương hiệu)

- `GET /api/brands` - Lấy tất cả thương hiệu
- `GET /api/brands/:id` - Lấy thương hiệu theo ID
- `POST /api/brands` - Tạo thương hiệu mới
- `PUT /api/brands/:id` - Cập nhật thương hiệu
- `DELETE /api/brands/:id` - Xóa thương hiệu

### Categories (Danh mục)

- `GET /api/categories` - Lấy tất cả danh mục
- `GET /api/categories/:id` - Lấy danh mục theo ID
- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/:id` - Cập nhật danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

### Products (Sản phẩm)

- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `GET /api/products/search?keyword=...` - Tìm kiếm sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

## 📝 Ví dụ Request/Response

### Tạo sản phẩm

**Request:**

```json
POST /api/products
{
  "name": "Motor Hồng Ký 3HP",
  "slug": "motor-hong-ky-3hp",
  "brand": "665a12...",
  "category": "665b45...",
  "description": [
    {
    "type": "text",
    "content": "Nội dung..."
    },
  {
    "type": "image",
    "url": "https://..."
  },
  {
    "type": "video",
    "url": "https://youtube.com/..."
  }
  ],
  "images": [
    {
      "type": "image",
      "url": "https://example.com/p1.jpg",
      "isMain": true
    },
    {
      "type": "youtube",
      "url": "https://www.youtube.com/watch?v=jAGI65kmsds"
    }
  ],
  "specs": [
    { "label": "Công suất", "value": "3 HP" },
    { "label": "Nguồn", "value": "220V" }
  ],
  "status": "in_stock"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "665f1c...",
    "name": "Motor Hồng Ký 3HP",
    "slug": "motor-hong-ky-3hp",
    "brand": "665a12...",
    "category": "665b45...",
    "description": "Motor hoạt động ổn định",
    "images": [
      {
        "type": "image",
        "url": "https://example.com/p1.jpg",
        "isMain": true
      },
      {
        "type": "youtube",
        "url": "https://www.youtube.com/watch?v=jAGI65kmsds"
      }
    ],
    "specs": [
      { "label": "Công suất", "value": "3 HP" },
      { "label": "Nguồn", "value": "220V" }
    ],
    "status": "in_stock",
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T10:00:00Z"
  },
  "message": "Product created successfully"
}
```

### Tạo danh mục

**Request:**

```json
POST /api/categories
{
  "name": "Motor điện",
  "slug": "motor-dien",
  "description": "Các loại motor điện công nghiệp",
  "parent": null
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "665f1c...",
    "name": "Motor điện",
    "slug": "motor-dien",
    "description": "Các loại motor điện công nghiệp",
    "parent": null,
    "createdAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-20T10:00:00Z"
  },
  "message": "Category created successfully"
}
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **CORS**: Cross-origin resource sharing
- **Environment**: dotenv

## 📦 Dependencies

- express@^4.18.2
- mongoose@^7.6.3
- cors@^2.8.5
- dotenv@^16.3.1
- bcryptjs@^2.4.3
- jsonwebtoken@^9.1.0
- multer@^1.4.5
- joi@^17.11.0

## 🔧 Development

- nodemon@^3.0.1 (tự động khởi động lại server khi file thay đổi)

## 📖 Hướng dẫn thêm

Các tính năng có thể mở rộng:

- 🔐 Authentication & Authorization
- 📸 Upload hình ảnh
- 📊 Statistics & Analytics
- 🔍 Advanced filtering & sorting
- 📄 Pagination
- ✔️ Input validation

---

**Developed with ❤️ for Kirinos Tool**
