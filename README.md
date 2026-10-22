# BÁO CÁO DỰ ÁN MÔN TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM
- **Họ và tên:** Lưu Thanh Nguyên
- **Lớp:** KTPM K23C
- **Mã sinh viên:** DTC245180007
- **Đề tài:** Đề 9 - Website Thương mại điện tử (E-commerce)

---

## 1. Cấu trúc hệ thống toàn diện
Toàn bộ hệ thống gồm 11 dịch vụ được điều phối thống nhất bằng Docker Compose:
- **web:** Ứng dụng E-commerce Node.js (Express) xử lý xem sản phẩm, giỏ hàng trượt và tạo đơn hàng. Container chạy tài khoản non-root `node` (Alpine).
- **db:** Cơ sở dữ liệu MySQL 8.0 lưu trữ bền vững qua Docker Volume `db_data`.
- **phpmyadmin:** Công cụ quản trị cơ sở dữ liệu trực quan trên nền web.
- **nginx:** Reverse Proxy đón nhận lưu lượng HTTPS cổng 443 (SSL tự ký), tự động chuyển hướng HTTP 80 sang 443, ẩn phiên bản máy chủ và thiết lập các HTTP Security Headers.
- **Hệ thống giám sát Metrics (Prometheus + Grafana):**
  - **cAdvisor:** Thu thập chỉ số tài nguyên (CPU, RAM, Network) của từng container.
  - **Node Exporter:** Giám sát tài nguyên máy chủ Ubuntu.
  - **MySQL Exporter:** Thu thập thông số hiệu năng chuyên sâu của MySQL.
  - **Prometheus:** Máy chủ lưu trữ Time-Series Database định kỳ lấy metrics.
  - **Grafana:** Trực quan hóa dữ liệu giám sát và log qua hệ thống Dashboard.
- **Hệ thống Log tập trung (Loki + Promtail):**
  - **Loki:** Thu thập, đánh chỉ mục và lưu trữ log tập trung.
  - **Promtail:** Agent tự động đọc log từ toàn bộ container Docker đẩy về Loki.
  - **LogQL:** Thực thi các câu truy vấn lọc lỗi, theo dõi request Nginx và đo tần suất log.

---

## 2. Các biện pháp Hardening (Bảo mật hệ thống)
1. **Chạy ứng dụng bằng Non-root User:** Container Node.js chạy bằng tài khoản `node` thay vì `root`, hạn chế rủi ro leo thang đặc quyền khi bị tấn công.
2. **Phân vùng mạng (Network Isolation):**
   - `frontend_net`: Dành cho Nginx tiếp nhận yêu cầu và chuyển tiếp tới Web/phpMyAdmin.
   - `backend_net`: Chỉ cho phép Web, phpMyAdmin, MySQL Exporter kết nối tới Database MySQL (cổng 3306 của DB được cô lập hoàn toàn, không lộ ra ngoài host).
3. **Chính sách mật khẩu mạnh:** Thiết lập mật khẩu phức tạp cho tài khoản quản trị và tài khoản dịch vụ, phân quyền tối thiểu (Least Privilege).
4. **Bảo mật Web Server Nginx:**
   - Ẩn thông tin phiên bản (`server_tokens off;`).
   - Cấu hình các HTTP Security Headers: `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`, `Referrer-Policy`.
   - Toàn bộ giao tiếp đều mã hóa bắt buộc qua SSL/TLS (HTTPS).

---

## 3. Hướng dẫn khởi chạy hệ thống
```bash
# Clone repository
git clone [https://github.com/DTC245180007/TKQT-DTC245180007-De09.git](https://github.com/DTC245180007/TKQT-DTC245180007-De09.git)
cd TKQT-DTC245180007-De09

# Khởi chạy toàn bộ hệ thống
docker compose up -d --build
