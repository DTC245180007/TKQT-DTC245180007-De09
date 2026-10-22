# Sử dụng môi trường Node.js phiên bản 18 gọn nhẹ dựa trên Linux Alpine
FROM node:18-alpine

# Thiết lập thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Sao chép file mô tả thư viện vào trước để tận dụng Docker cache
COPY package*.json ./

# Cài đặt các thư viện cần thiết
RUN npm install --production

# Sao chép toàn bộ mã nguồn vào thư mục làm việc
COPY . .

# Thay đổi quyền sở hữu thư mục mã nguồn cho tài khoản 'node'
RUN chown -R node:node /usr/src/app

# BIỆN PHÁP HARDENING: Chuyển sang tài khoản non-root 'node' để chạy ứng dụng
USER node

# Khai báo cổng ứng dụng lắng nghe
EXPOSE 3000

# Lệnh khởi động server
CMD ["node", "server.js"]
