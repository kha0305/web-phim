# Web Phim - Movie Streaming Application

Một ứng dụng web xem phim trực tuyến hiện đại, cho phép người dùng xem phim từ nhiều nguồn khác nhau, quản lý lịch sử xem, danh sách yêu thích và thông tin cá nhân.

## 🚀 Tính năng

- **Xem phim trực tuyến:** Tích hợp nguồn phim từ `iphim.cc`, `phimapi.com`, và `ophim1.com`.
- **Tìm kiếm:** Tìm kiếm phim theo tên.
- **Phân loại:** Duyệt phim theo thể loại, danh sách (phim lẻ, phim bộ, phim mới).
- **Tài khoản người dùng:** Đăng ký, đăng nhập, cập nhật thông tin cá nhân (avatar, tên hiển thị).
- **Lịch sử xem:** Tự động lưu lại tiến độ xem phim và lịch sử các phim đã xem.
- **Danh sách yêu thích:** Lưu phim vào danh sách xem sau.
- **Giao diện hiện đại:** Thiết kế Responsive, Dark mode, hiệu ứng mượt mà.

## 🛠 Công nghệ sử dụng

### Frontend

- **React:** Thư viện UI chính.
- **Vite:** Build tool nhanh chóng.
- **React Router:** Quản lý điều hướng.
- **Axios:** Gọi API.
- **Hls.js:** Phát video streaming (HLS).
- **CSS:** Custom CSS với biến (Variables) và Flexbox/Grid.

### Backend

- **Node.js & Express:** Server API.
- **MySQL:** Cơ sở dữ liệu quan hệ.
- **Sequelize:** ORM để tương tác với database.
- **JWT (JSON Web Token):** Xác thực người dùng.
- **Bcryptjs:** Mã hóa mật khẩu.

## ⚙️ Yêu cầu cài đặt

- **Node.js:** Phiên bản 16 trở lên.
- **MySQL:** Đã cài đặt và đang chạy.

## 📦 Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/kha0305/web-phim.git
cd web-phim
```

### 2. Cài đặt Backend

Di chuyển vào thư mục backend và cài đặt các thư viện:

```bash
cd backend
npm install
```

**Cấu hình Database:**

1.  Tạo một database trống trong MySQL tên là `webphim` (hoặc tên khác tùy bạn chọn).
2.  Tạo file `.env` trong thư mục `backend` dựa trên file `.env.example`:

```bash
cp .env.example .env
```

3.  Mở file `.env` và cập nhật thông tin kết nối database của bạn:

```env
PORT=5000
JWT_SECRET=ma_bi_mat_cua_ban
DB_NAME=webphim
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_HOST=localhost
```

_Lưu ý: Nếu không tạo file `.env`, hệ thống sẽ sử dụng cấu hình mặc định (User: root, Pass: 190705)._

### 3. Cài đặt Frontend

Mở một terminal mới, di chuyển vào thư mục frontend và cài đặt thư viện:

```bash
cd frontend
npm install
```

## ▶️ Hướng dẫn chạy

Bạn cần chạy cả Backend và Frontend đồng thời.

### Chạy Backend

Trong terminal của thư mục `backend`:

```bash
npm run dev
```

_Server sẽ chạy tại: `http://localhost:5000`_
_Database sẽ tự động được đồng bộ (tạo bảng) khi chạy lần đầu._

### Chạy Frontend

Trong terminal của thư mục `frontend`:

```bash
npm run dev
```

_Ứng dụng sẽ chạy tại: `http://localhost:5173` (hoặc port khác do Vite cấp)_

## 🗂 Cấu trúc thư mục

```
web-phim/
├── backend/            # Source code Backend
│   ├── data/           # Dữ liệu mẫu (nếu có)
│   ├── uploads/        # Thư mục chứa avatar người dùng upload
│   ├── index.js        # Entry point của server
│   ├── db.js           # Cấu hình kết nối Database
│   ├── models.js       # Định nghĩa các bảng (User, History, Watchlist...)
│   └── ...
├── frontend/           # Source code Frontend
│   ├── src/
│   │   ├── components/ # Các component tái sử dụng (MovieCard, Navbar...)
│   │   ├── pages/      # Các trang chính (Home, MovieDetail, Profile...)
│   │   ├── App.jsx     # Component gốc và Routing
│   │   └── index.css   # Global styles
│   └── ...
└── README.md           # Hướng dẫn sử dụng
```

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng tạo Pull Request hoặc mở Issue nếu bạn tìm thấy lỗi.
