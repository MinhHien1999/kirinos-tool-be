# Kirinos Tool Backend

Backend API cho ứng dụng **Kirinos Tool**, được xây dựng bằng **Express.js** và **MongoDB (Mongoose)** theo mô hình **MVC (Model - View - Controller)**.

> ⚠️ **Security Notice:** Repository này chỉ cung cấp thông tin kiến trúc và tài liệu API ở mức an toàn. Không công khai credentials, connection strings, JWT secrets hoặc các endpoint thao tác dữ liệu production.

---

## 📁 Cấu trúc dự án

```text
kirinos-tool-be/

├── config/
│   └── database.js             # Cấu hình kết nối MongoDB
│
├── models/
│   ├── Brand.js                # Schema thương hiệu
│   ├── Product.js              # Schema sản phẩm
│   ├── Category.js             # Schema danh mục
│   ├── Invoice.js              # Schema hóa đơn
│   ├── InvoiceDetail.js        # Schema chi tiết hóa đơn
│   └── index.js                # Export tất cả models
│
├── controllers/
│   ├── brandController.js      # Logic xử lý thương hiệu
│   ├── productController.js    # Logic xử lý sản phẩm
│   ├── categoryController.js   # Logic xử lý danh mục
│   └── invoiceController.js     # Logic xử lý hóa đơn
│
├── routes/
│   ├── brandRoutes.js           # Route thương hiệu
│   ├── productRoutes.js         # Route sản phẩm
│   ├── categoryRoutes.js        # Route danh mục
│   └── invoiceRoutes.js         # Route hóa đơn
│
├── middlewares/
│   └── errorHandler.js          # Xử lý lỗi và logging
│
├── utils/
│   └── helpers.js               # Các hàm tiện ích
│
├── server.js                    # File khởi động server
├── package.json                 # Dependencies
└── .env.example                 # Biến môi trường mẫu
```

---

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Tạo file `.env`

```bash
cp .env.example .env
```

### 3. Cấu hình MongoDB

Cập nhật biến môi trường trong file `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/kirinos-tool
PORT=3000
NODE_ENV=development
```

> Không commit file `.env` hoặc bất kỳ credentials/secret nào lên GitHub.

### 4. Khởi động server

```bash
npm run dev
```

---

## 📚 API

Backend cung cấp RESTful API cho các nhóm tài nguyên:

### Brands

```text
GET /api/brands
GET /api/brands/:id
```

Dùng để lấy danh sách thương hiệu và thông tin một thương hiệu.

### Categories

```text
GET /api/categories
GET /api/categories/:id
```

Dùng để lấy danh sách danh mục và thông tin một danh mục.

### Products

```text
GET /api/products
GET /api/products/:id
GET /api/products/search?keyword=...
```

Dùng để lấy danh sách sản phẩm, thông tin chi tiết và tìm kiếm sản phẩm.

### Invoices

Các API liên quan đến hóa đơn được tổ chức trong:

```text
/api/invoices
```

Chi tiết các endpoint thao tác dữ liệu không được công khai trong README của repository production.

---

## 📦 Product Data

Một sản phẩm có thể bao gồm các thông tin như:

```json
{
  "name": "Tên sản phẩm",
  "slug": "ten-san-pham",
  "brand": "brandId",
  "category": "categoryId",
  "description": [],
  "images": [],
  "specs": [],
  "status": "in_stock"
}
```

### Images

Hệ thống hỗ trợ nhiều loại nội dung trong gallery sản phẩm, bao gồm hình ảnh và video YouTube.

Ví dụ:

```json
{
  "type": "image",
  "url": "https://example.com/image.jpg",
  "isMain": true
}
```

hoặc:

```json
{
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=..."
}
```

### Specifications

Thông tin kỹ thuật của sản phẩm được lưu dưới dạng danh sách:

```json
{
  "label": "Công suất",
  "value": "3 HP"
}
```

---

## 🏗️ Architecture

Project sử dụng mô hình **MVC** và phân chia trách nhiệm giữa các layer:

```text
Request
   ↓
Routes
   ↓
Controllers
   ↓
Models
   ↓
MongoDB
```

### Routes

Định nghĩa các API endpoint và chuyển request đến controller tương ứng.

### Controllers

Chứa business logic và xử lý request/response.

### Models

Định nghĩa schema và tương tác với MongoDB thông qua Mongoose.

### Middlewares

Xử lý các logic dùng chung như error handling.

### Utils

Chứa các helper functions được sử dụng trong nhiều phần của hệ thống.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT
- **Password Hashing:** bcryptjs
- **File Upload:** Multer
- **Validation:** Joi
- **CORS:** cors
- **Environment Variables:** dotenv

---

## 📦 Dependencies

### Production

```text
express
mongoose
cors
dotenv
bcryptjs
jsonwebtoken
multer
joi
```

### Development

```text
nodemon
```

---

## 🔐 Security

Một số nguyên tắc bảo mật được áp dụng trong project:

- Sử dụng biến môi trường cho các thông tin cấu hình.
- Không commit `.env` lên repository.
- Sử dụng JWT cho authentication.
- Hash password trước khi lưu vào database.
- Validate dữ liệu đầu vào.
- Sử dụng middleware để xử lý lỗi.
- Cấu hình CORS cho việc giao tiếp giữa Frontend và Backend.

**Các endpoint có khả năng tạo, cập nhật hoặc xóa dữ liệu production không được liệt kê công khai trong README.**

---

## 🌐 Frontend

Frontend của Kirinos Tool được xây dựng riêng bằng Next.js và ReactJS.

**Frontend Repository:**

https://github.com/MinhHien1999/kirinos-tool-fe

**Live Demo:**

https://kirinos-tool.vercel.app/

---

## 👨‍💻 Author

**Huỳnh Hữu Minh Hiền**

GitHub: https://github.com/MinhHien1999

---

**Developed with ❤️ for Kirinos Tool**
