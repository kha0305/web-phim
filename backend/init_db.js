const mysql = require('mysql2/promise');

async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '190705'
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS webphim');
    console.log('Database "webphim" created or already exists.');
    await connection.end();
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
}

initializeDatabase();
