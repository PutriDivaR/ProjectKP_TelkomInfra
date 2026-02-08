const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();
const app = express();

// Middleware untuk parsing JSON dan URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // ✅ Naik 1 level ke parent

// middleware
// Increase body size limits to allow large Excel->JSON imports from client
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
// Setup static files
app.use(express.static(path.join(__dirname, '../public'))); // ✅ Naik 1 level ke parent

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'telkom-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);

// Logging middleware (optional, untuk debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Expose session user to all views
app.use((req, res, next) => {
  res.locals.user = req.session ? req.session.user : null;
  next();
});

// Import routes (sekarang di folder yang sama)
const dashboardRoutes = require('./routes/dashboard.routes'); // ✅ Path relatif
const kendalaTeknikRoutes = require('./routes/kendalateknik.routes'); // ✅ Path relatif
const todolistRoutes = require('./routes/todolist.routes'); // ✅ missing — mounts /todolist
const authRoutes = require('./routes/auth.routes'); // ✅ Auth routes (login/register/API)

// Simple auth guard middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

// Use routes
// Mount dashboard under /dashboard so links like /dashboard and /dashboard/api/refresh work
app.use('/', authRoutes); // serve /login, /register and /api/auth/*
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/', requireAuth, kendalaTeknikRoutes);
app.use('/', requireAuth, todolistRoutes); // serve /todolist and its APIs

// bot API routes 
const botRoutes = require('./routes/bot.routes');
app.use('/api/bot', botRoutes);

// kendala routes
const kendalaRoutes = require('./routes/kendala.routes');
app.use('/kendala', requireAuth, kendalaRoutes);

// daily routes
const dailyRoutes = require('./routes/daily.routes');
app.use('/dailyhouse', requireAuth, dailyRoutes);

// Entry flow: if authenticated go to dashboard, else to login
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

module.exports = app;
