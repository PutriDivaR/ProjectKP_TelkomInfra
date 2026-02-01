const express = require('express');
const path = require('path');
const app = express();

// Middleware untuk parsing JSON dan URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // ✅ Naik 1 level ke parent

// Setup static files
app.use(express.static(path.join(__dirname, '../public'))); // ✅ Naik 1 level ke parent

// Logging middleware (optional, untuk debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes (sekarang di folder yang sama)
const dashboardRoutes = require('./routes/dashboard.routes'); // ✅ Path relatif
const kendalaTeknikRoutes = require('./routes/kendalateknik.routes'); // ✅ Path relatif

// Use routes
app.use('/', dashboardRoutes);
app.use('/', kendalaTeknikRoutes);

module.exports = app;