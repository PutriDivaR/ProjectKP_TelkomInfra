const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// routes
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/', dashboardRoutes);

// bot API routes 
const botRoutes = require('./routes/bot.routes');
app.use('/api/bot', botRoutes);

module.exports = app;
