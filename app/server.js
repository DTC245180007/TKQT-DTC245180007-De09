const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình kết nối MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'ecommerce_user',
  password: process.env.DB_PASSWORD || 'SecurePass@2026',
  database: process.env.DB_NAME || 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Vòng lặp tự động thử kết nối và khởi tạo bảng trong MySQL
function initDB(retryCount = 15) {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.log(`Đang chờ MySQL sẵn sàng... (còn ${retryCount} lần thử)`);
      if (retryCount > 0) {
        return setTimeout(() => initDB(retryCount - 1), 2000);
      }
      return console.error('Không thể kết nối MySQL sau nhiều lần thử:', err.message);
    }

    console.log('Kết nối MySQL thành công! Đang thiết lập bảng dữ liệu...');

    // 1. Tạo bảng sản phẩm
    db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 10,
        image_url VARCHAR(500)
      );
    `, (err) => {
      if (err) return console.error('Lỗi tạo bảng products:', err.message);

      // 2. Tạo bảng đơn hàng
      db.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(50),
          customer_address VARCHAR(255),
          total_amount DECIMAL(12, 2) NOT NULL,
          items_detail TEXT,
          status VARCHAR(50) DEFAULT 'Đã xác nhận',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Nạp 8 sản phẩm mẫu
      db.query('SELECT COUNT(*) AS count FROM products', (err, rows) => {
        if (!err && rows[0].count === 0) {
          const sampleProducts = [
            ['MacBook Pro 14 M3', 'Laptop', 39990000, 8, '💻'],
            ['Dell XPS 15 9530', 'Laptop', 36500000, 5, '💻'],
            ['Bàn phím cơ FL-Esports CMK75', 'Phụ kiện', 2150000, 25, '⌨️'],
            ['Bàn phím cơ Keychron K2 Pro', 'Phụ kiện', 2450000, 18, '⌨️'],
            ['Chuột Logitech MX Master 3S', 'Phụ kiện', 2290000, 30, '🖱️'],
            ['Màn hình LG UltraFine 27" 4K', 'Màn hình', 9890000, 12, '🖥️'],
            ['Màn hình Dell UltraSharp 27"', 'Màn hình', 12490000, 7, '🖥️'],
            ['Tai nghe Sony WH-1000XM5', 'Âm thanh', 6890000, 15, '🎧']
          ];
          db.query('INSERT INTO products (name, category, price, stock, image_url) VALUES ?', [sampleProducts], (err) => {
            if (!err) console.log('Đã nạp 8 sản phẩm mẫu vào MySQL thành công!');
          });
        }
      });
    });
  });
}

// Chạy khởi tạo
initDB();

// API lấy sản phẩm
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API lưu đơn hàng
app.post('/api/checkout', (req, res) => {
  const { customerName, customerPhone, customerAddress, items, totalAmount } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống!' });
  }

  const itemsSummary = items.map(i => `${i.name} (x${i.qty})`).join(', ');
  const sql = `INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, items_detail) VALUES (?, ?, ?, ?, ?)`;

  db.query(sql, [customerName, customerPhone, customerAddress, totalAmount, itemsSummary], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, orderId: result.insertId });
  });
});

// API lấy đơn hàng
app.get('/api/orders', (req, res) => {
  db.query('SELECT * FROM orders ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Giao diện web
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TECHSTORE - Cửa Hàng Công Nghệ Trực Tuyến</title>
  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --dark: #0f172a;
      --gray-bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #334155;
      --red: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--gray-bg); color: var(--text); padding-bottom: 60px; }

    header { background: #ffffff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .nav-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
    .brand { font-size: 22px; font-weight: 800; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .nav-actions { display: flex; gap: 16px; align-items: center; }
    .btn-nav { background: none; border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
    .btn-nav:hover { background: #f1f5f9; }
    .cart-btn { background: var(--primary); color: white; border: none; }
    .cart-btn:hover { background: var(--primary-hover); }
    .badge { background: var(--red); color: white; font-size: 11px; padding: 2px 7px; border-radius: 999px; }

    .hero { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; margin-bottom: 35px; }
    .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .hero p { opacity: 0.9; font-size: 16px; }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .section-title { font-size: 22px; font-weight: 700; color: var(--dark); }

    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }
    .product-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.08); border-color: #cbd5e1; }
    .card-thumb { height: 160px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 64px; }
    .card-body { padding: 18px; display: flex; flex-direction: column; flex-grow: 1; }
    .category-tag { font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--primary); letter-spacing: 0.5px; margin-bottom: 6px; }
    .product-title { font-size: 16px; font-weight: 600; color: var(--dark); margin-bottom: 10px; line-height: 1.4; height: 44px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .product-rating { color: #f59e0b; font-size: 13px; margin-bottom: 12px; }
    .card-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .product-price { font-size: 17px; font-weight: 700; color: var(--red); }
    .btn-add { background: #eff6ff; color: var(--primary); border: 1px solid #bfdbfe; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
    .btn-add:hover { background: var(--primary); color: white; }

    .cart-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: none; }
    .cart-drawer { position: fixed; top: 0; right: -420px; width: 400px; height: 100vh; background: white; z-index: 210; box-shadow: -5px 0 25px rgba(0,0,0,0.15); transition: right 0.3s ease; display: flex; flex-direction: column; }
    .cart-drawer.open { right: 0; }
    .drawer-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
    .drawer-footer { padding: 20px; border-top: 1px solid var(--border); background: #fafafa; }
    .cart-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .cart-item-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .cart-item-price { color: var(--red); font-size: 13px; font-weight: 600; }
    .qty-controls { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .qty-btn { width: 26px; height: 26px; border: 1px solid var(--border); background: white; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .input-field { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; }
    .btn-checkout { width: 100%; background: #16a34a; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.2s; }
    .btn-checkout:hover { background: #15803d; }

    .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; display: none; align-items: center; justify-content: center; }
    .modal-content { background: white; width: 90%; max-width: 800px; max-height: 85vh; border-radius: 12px; padding: 25px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
    th { background: #f8fafc; font-weight: 600; }
    .order-status { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }

    footer { margin-top: 60px; background: white; border-top: 1px solid var(--border); padding: 25px 20px; text-align: center; color: #64748b; font-size: 14px; }
  </style>
</head>
<body>

  <header>
    <div class="nav-container">
      <a href="/" class="brand">⚡ TECHSTORE</a>
      <div class="nav-actions">
        <button class="btn-nav" onclick="openOrdersModal()">📦 Lịch sử Đơn hàng</button>
        <button class="btn-nav cart-btn" onclick="toggleCart(true)">
          🛒 Giỏ hàng <span class="badge" id="cartCount">0</span>
        </button>
      </div>
    </div>
  </header>

  <section class="hero">
    <h1>Cửa Hàng Thiết Bị & Phụ Kiện Công Nghệ</h1>
    <p>Trải nghiệm mua sắm trực tuyến nhanh chóng, tin cậy và bảo mật qua Nginx Reverse Proxy</p>
  </section>

  <main class="container">
    <div class="section-header">
      <h2 class="section-title">Danh Sách Sản Phẩm Nổi Bật</h2>
      <span style="font-size: 14px; color: #64748b;">Sản phẩm chính hãng có sẵn trong kho</span>
    </div>
    
    <div class="product-grid" id="productGrid">
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Đang tải danh sách sản phẩm...</div>
    </div>
  </main>

  <!-- Giỏ Hàng Trượt -->
  <div class="cart-drawer-overlay" id="cartOverlay" onclick="toggleCart(false)"></div>
  <aside class="cart-drawer" id="cartDrawer">
    <div class="drawer-header">
      <h3 style="font-weight: 700;">Giỏ Hàng Của Bạn</h3>
      <button onclick="toggleCart(false)" style="background:none; border:none; font-size:22px; cursor:pointer;">&times;</button>
    </div>
    <div class="drawer-body" id="cartItemsContainer">
      <p style="text-align: center; color: #94a3b8; margin-top: 50px;">Giỏ hàng của bạn đang trống</p>
    </div>
    <div class="drawer-footer">
      <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:700; font-size:16px;">
        <span>Tổng thanh toán:</span>
        <span id="cartTotal" style="color:var(--red);">0 VNĐ</span>
      </div>
      <div id="checkoutForm" style="display: none;">
        <input type="text" id="custName" class="input-field" placeholder="Họ và tên người nhận (*)" required>
        <input type="text" id="custPhone" class="input-field" placeholder="Số điện thoại liên hệ (*)" required>
        <input type="text" id="custAddress" class="input-field" placeholder="Địa chỉ giao hàng (*)" required>
        <button class="btn-checkout" onclick="submitOrder()">Xác Nhận Đặt Hàng</button>
      </div>
    </div>
  </aside>

  <!-- Modal Đơn Hàng -->
  <div class="modal" id="ordersModal">
    <div class="modal-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="font-weight: 700;">Lịch Sử Đơn Hàng (Đã lưu trong MySQL)</h3>
        <button onclick="closeOrdersModal()" style="background:none; border:none; font-size:22px; cursor:pointer;">&times;</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Mã Đơn</th>
              <th>Khách Hàng</th>
              <th>SĐT</th>
              <th>Mặt Hàng</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr><td colspan="6" style="text-align:center;">Đang tải dữ liệu...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <footer>
    <p>© 2026 TECHSTORE - Hệ Thống Bán Lẻ Thiết Bị Công Nghệ Trực Tuyến</p>
    <p style="margin-top: 6px; font-size: 13px; color: #94a3b8;">Bảo mật SSL 256-bit | Nginx Reverse Proxy | MySQL Database</p>
  </footer>

  <script>
    let products = [];
    let cart = [];

    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Chưa kết nối được DB');
        products = await res.json();
        
        if (!Array.isArray(products) || products.length === 0) {
          setTimeout(loadProducts, 2000);
          return;
        }

        const grid = document.getElementById('productGrid');
        grid.innerHTML = products.map(p => \`
          <div class="product-card">
            <div class="card-thumb">\${p.image_url || '📦'}</div>
            <div class="card-body">
              <span class="category-tag">\${p.category}</span>
              <h3 class="product-title">\${p.name}</h3>
              <div class="product-rating">★★★★★ (Chính Hãng)</div>
              <div class="card-footer">
                <span class="product-price">\${Number(p.price).toLocaleString('vi-VN')} đ</span>
                <button class="btn-add" onclick="addToCart(\${p.id})">+ Thêm giỏ</button>
              </div>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        setTimeout(loadProducts, 2000);
      }
    }

    function addToCart(productId) {
      const p = products.find(item => item.id === productId);
      const existing = cart.find(item => item.id === productId);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...p, qty: 1 });
      }
      updateCartUI();
      toggleCart(true);
    }

    function changeQty(productId, delta) {
      const item = cart.find(i => i.id === productId);
      if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
          cart = cart.filter(i => i.id !== productId);
        }
      }
      updateCartUI();
    }

    function updateCartUI() {
      const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
      document.getElementById('cartCount').textContent = totalCount;

      const container = document.getElementById('cartItemsContainer');
      const checkoutForm = document.getElementById('checkoutForm');

      if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; margin-top:50px;">Giỏ hàng của bạn đang trống</p>';
        document.getElementById('cartTotal').textContent = '0 VNĐ';
        checkoutForm.style.display = 'none';
        return;
      }

      checkoutForm.style.display = 'block';
      let totalMoney = 0;
      container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        totalMoney += itemTotal;
        return \`
          <div class="cart-item">
            <div>
              <div class="cart-item-title">\${item.name}</div>
              <div class="cart-item-price">\${Number(item.price).toLocaleString('vi-VN')} đ</div>
              <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty(\${item.id}, -1)">-</button>
                <span style="font-size:14px; font-weight:600;">\${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(\${item.id}, 1)">+</button>
              </div>
            </div>
            <div style="font-weight:700; font-size:14px;">\${Number(itemTotal).toLocaleString('vi-VN')} đ</div>
          </div>
        \`;
      }).join('');

      document.getElementById('cartTotal').textContent = Number(totalMoney).toLocaleString('vi-VN') + ' VNĐ';
    }

    function toggleCart(open) {
      const drawer = document.getElementById('cartDrawer');
      const overlay = document.getElementById('cartOverlay');
      if (open) {
        drawer.classList.add('open');
        overlay.style.display = 'block';
      } else {
        drawer.classList.remove('open');
        overlay.style.display = 'none';
      }
    }

    async function submitOrder() {
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const address = document.getElementById('custAddress').value.trim();

      if (!name || !phone || !address) {
        alert('Vui lòng điền đủ Họ tên, Số điện thoại và Địa chỉ!');
        return;
      }

      const totalAmount = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          items: cart,
          totalAmount: totalAmount
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('🎉 Đặt hàng thành công! Mã đơn của bạn: #DH-' + data.orderId);
        cart = [];
        updateCartUI();
        toggleCart(false);
      } else {
        alert('Lỗi đặt hàng: ' + data.message);
      }
    }

    async function openOrdersModal() {
      document.getElementById('ordersModal').style.display = 'flex';
      const tbody = document.getElementById('ordersTableBody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      
      const res = await fetch('/api/orders');
      const orders = await res.json();

      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Chưa có đơn hàng nào được đặt.</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(o => \`
        <tr>
          <td><strong>#DH-\${o.id}</strong></td>
          <td>\${o.customer_name}</td>
          <td>\${o.customer_phone || '---'}</td>
          <td style="max-width:250px;">\${o.items_detail || 'Sản phẩm'}</td>
          <td><strong style="color:var(--red);">\${Number(o.total_amount).toLocaleString('vi-VN')} đ</strong></td>
          <td><span class="order-status">\${o.status}</span></td>
        </tr>
      \`).join('');
    }

    function closeOrdersModal() {
      document.getElementById('ordersModal').style.display = 'none';
    }

    loadProducts();
  </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`E-commerce Web App ready on port ${port}`);
});
