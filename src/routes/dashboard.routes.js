const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  return res.redirect('/dashboard');
});

router.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard Monitoring Kendala',
    adminName: 'Admin User'
  });
});

module.exports = router;
