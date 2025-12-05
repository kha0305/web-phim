require('dotenv').config();
const sequelize = require('./db');
const { User, History, Watchlist, Otp } = require('./models');

const resetDatabase = async () => {
  try {
    console.log('🗑️  Đang xóa toàn bộ dữ liệu...');
    
    // force: true sẽ xóa (drop) các bảng và tạo lại từ đầu
    await sequelize.sync({ force: true });
    
    console.log('✅ Đã xóa sạch dữ liệu và tạo lại bảng thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi reset database:', error);
    process.exit(1);
  }
};

resetDatabase();
