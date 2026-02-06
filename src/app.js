const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// middleware
// Increase body size limits to allow large Excel->JSON imports from client
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// routes
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/', dashboardRoutes);

// bot API routes 
const botRoutes = require('./routes/bot.routes');
app.use('/api/bot', botRoutes);

const dailyRoutes = require('./routes/daily.routes');
app.use('/daily', dailyRoutes);

module.exports = app;
