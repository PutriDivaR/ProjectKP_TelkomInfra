const express = require('express');
const path = require('path');
const app = express();

// Middleware untuk parsing JSON dan URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
const todolistRoutes = require('./routes/todolist.routes'); // ✅ missing — mounts /todolist

// Use routes
app.use('/', dashboardRoutes);
app.use('/', kendalaTeknikRoutes);
app.use('/', todolistRoutes); // serve /todolist and its APIs

// bot API routes 
const botRoutes = require('./routes/bot.routes');
app.use('/api/bot', botRoutes);

module.exports = app;
