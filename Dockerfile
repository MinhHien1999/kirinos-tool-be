# Sử dụng image Node.js chính thức
FROM node:18-alpine

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json trước để tận dụng Docker cache
COPY package*.json ./

# Cài đặt dependencies (chỉ production hoặc đầy đủ)
RUN npm install

# Copy toàn bộ source code còn lại vào container
COPY . .

# Cổng mà ứng dụng sẽ lắng nghe
EXPOSE 8080

# Lệnh khởi động ứng dụng
CMD ["npm", "start"]