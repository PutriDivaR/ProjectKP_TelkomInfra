const express  = require('express');
const path     = require('path');
const session  = require('express-session');
require('dotenv').config();

const app = express();

// ════════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════════

// Body parsing (50mb untuk import Excel besar)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Session
app.use(session({
  secret:            process.env.SESSION_SECRET || 'telkom-dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 jam
}));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Expose session user ke semua views (res.locals.user)
app.use((req, res, next) => {
  res.locals.user = req.session?.user ?? null;
  next();
});

// ════════════════════════════════════════════
// AUTH GUARD
// ════════════════════════════════════════════

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  return res.redirect('/login');
}

// ════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════

// Auth (login / register / logout)
const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);

// Dashboard
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/dashboard', requireAuth, dashboardRoutes);

// Todolist (Kendala Teknik Sistem)
const todolistRoutes = require('./routes/todolist.routes');
app.use('/', requireAuth, todolistRoutes);

// Kendala Pelanggan
const kendalaRoutes = require('./routes/kendala.routes');
app.use('/kendala', requireAuth, kendalaRoutes);

// Daily Housekeeping
const dailyRoutes = require('./routes/daily.routes');
app.use('/dailyhouse', requireAuth, dailyRoutes);

// Data Kendala (Kendala Teknik + Kendala Sistem / import file)
const datakendalaRoutes = require('./routes/datakendala.routes');
app.use('/datakendala', requireAuth, datakendalaRoutes);

// Sumber Data — Master Activity (Kendala Teknik)
const kendalaTeknikRoutes = require('./routes/kendalateknik.routes');
app.use('/', requireAuth, kendalaTeknikRoutes);

// Sumber Data — Wilayah Ridar
const wilayahRidarRoutes = require('./routes/wilayahridar.routes');
app.use('/', requireAuth, wilayahRidarRoutes);

// Bot API
const botRoutes = require('./routes/bot.routes');
app.use('/api/bot', botRoutes);

// ════════════════════════════════════════════
// ROOT REDIRECT
// ════════════════════════════════════════════

app.get('/', (req, res) => {
  if (req.session?.user) return res.redirect('/dashboard');
  return res.redirect('/login');
});

module.exports = app;