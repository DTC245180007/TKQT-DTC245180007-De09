# BÁO CÁO DỰ ÁN MÔN TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
- **Họ và tên:** Lưu Thanh Nguyên
- **Lớp:** KTPM K23C
- **Mã sinh viên:** DTC245180007
- **Đề tài:** Đề 9 - Website Thương mại điện tử (E-commerce)

---

## 1. Cấu trúc hệ thống
Hệ thống được đóng gói và vận hành hoàn toàn bằng Docker Compose:
- **web:** Ứng dụng Web E-commerce Node.js (Express) xử lý danh mục sản phẩm, giỏ hàng trượt và tạo đơn hàng. Container chạy quyền user non-root `node` (Hardening).
- **db:** Cơ sở dữ liệu MySQL 8.0 lưu trữ bền vững qua Docker Volume.
- **phpmyadmin:** Công cụ quản trị cơ sở dữ liệu trực quan trên nền web.
- **nginx:** Reverse Proxy tiếp nhận lưu lượng HTTPS cổng 443 (SSL tự ký), tự động chuyển hướng HTTP sang HTTPS, ẩn phiên bản Nginx và thiết lập các HTTP Security Headers.
- **Hệ thống giám sát (Monitoring):**
  - **cAdvisor:** Thu thập metrics tài nguyên phần cứng (CPU, Memory, Network) của từng container.
  - **Node Exporter:** Giám sát tài nguyên máy chủ hệ thống.
  - **MySQL Exporter:** Thu thập thông số hiệu năng chuyên sâu của cơ sở dữ liệu MySQL.
  - **Prometheus:** Máy chủ lưu trữ chuỗi thời gian, định kỳ scrape metrics từ các exporter.
  - **Grafana:** Trực quan hóa dữ liệu giám sát qua hệ thống Dashboard đồ thị trực quan.
- **Phân vùng mạng (Network Isolation):** Tách biệt `frontend_net` và `backend_net` bảo vệ cơ sở dữ liệu khỏi truy cập trực tiếp từ bên ngoài.

## 2. Hướng dẫn khởi chạy
```bash
# Clone repository
git clone [https://github.com/DTC245180007/TKQT-DTC245180007-De09.git](https://github.com/DTC245180007/TKQT-DTC245180007-De09.git)
cd TKQT-DTC245180007-De09

# Khởi chạy toàn bộ hệ thống
docker compose up -d --build
