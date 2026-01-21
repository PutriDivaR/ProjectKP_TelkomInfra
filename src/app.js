const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/', dashboardRoutes);

module.exports = app;
