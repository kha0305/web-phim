# Hướng dẫn Deploy lên Vercel và Aiven

## 1. Setup Database trên Aiven

1. Tạo tài khoản tại [Aiven.io](https://aiven.io/).
2. Tạo mới một service **MySQL**.
3. Sau khi service chạy (Running), lấy thông tin kết nối (Connection URI hoặc từng phần):
   - **Host**: (ví dụ: `mysql-service-account.aivencloud.com`)
   - **Port**: (ví dụ: `12345`)
   - **User**: (ví dụ: `avnadmin`)
   - **Password**: (Lấy trong dashboard)
   - **Database Name**: `defaultdb` (hoặc tạo mới)

## 2. Chuẩn bị Code (Đã thực hiện tự động)

- **Frontend**: Đã cập nhật để đọc `VITE_API_URL`.
- **Backend**: Đã cập nhật để export app cho Vercel và thêm `vercel.json`.

## 3. Deploy Backend lên Vercel (Domain: apimovie.server.id.vn)

1. Đẩy code lên GitHub.
2. Vào [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New...** -> **Project**.
3. Chọn repo của bạn.
4. **Quan trọng**: Tại phần **Root Directory**, bấm **Edit** và chọn thư mục `backend`.
5. Tại phần **Environment Variables**, thêm các biến sau (lấy từ Aiven):
   - `DB_HOST`: Host của Aiven
   - `DB_USER`: User của Aiven
   - `DB_PASSWORD`: Password của Aiven
   - `DB_NAME`: Tên database
   - `DB_PORT`: Port của Aiven
   - `JWT_SECRET`: `hK9#mP2$vL5@zN8!qR3&jX6_WebPhim_Secure_2024` (hoặc chuỗi bạn chọn)
6. Bấm **Deploy**.
7. **Cấu hình Domain**:
   - Vào tab **Settings** -> **Domains**.
   - Thêm domain: `apimovie.server.id.vn`.
   - Vercel sẽ cung cấp thông tin DNS (thường là CNAME `cname.vercel-dns.com`). Bạn cần vào trang quản lý tên miền của bạn để cấu hình record này.

## 4. Deploy Frontend lên Vercel (Domain: movie.server.id.vn)

1. Vào Vercel Dashboard -> **Add New...** -> **Project**.
2. Chọn lại repo cũ.
3. **Quan trọng**: Tại phần **Root Directory**, bấm **Edit** và chọn thư mục `frontend`.
4. Tại phần **Environment Variables**, thêm biến:
   - `VITE_API_URL`: `https://apimovie.server.id.vn/api`
     _(Lưu ý: Phải chính xác là domain backend bạn vừa cài đặt)_
5. Bấm **Deploy**.
6. **Cấu hình Domain**:
   - Vào tab **Settings** -> **Domains**.
   - Thêm domain: `movie.server.id.vn`.
   - Cấu hình DNS tương tự như backend.

## Lưu ý quan trọng

- **Upload ảnh**: Vercel là môi trường Serverless nên không lưu được file upload vào thư mục `uploads/`. Bạn cần chuyển sang dùng dịch vụ lưu trữ ngoài như **Cloudinary** hoặc **Firebase Storage** nếu muốn tính năng upload avatar hoạt động lâu dài.
