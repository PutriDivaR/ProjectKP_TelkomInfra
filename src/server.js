const app = require('./app'); // ✅ app.js ada di folder yang sama
const db = require('./config/db'); // ✅ config/db.js ada di subfolder

const PORT = process.env.PORT || 3000;

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your database configuration in src/config/db.js');
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
    
    // Start server only if database is connected
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running di http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/`);
      console.log(`🔧 Kendala Teknik: http://localhost:${PORT}/kendala-teknik`);
      console.log('='.repeat(50));
    });
  }
});