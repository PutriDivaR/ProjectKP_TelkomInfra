const express = require('express');
const router = express.Router();
const path = require('path');
const db = require(path.resolve(__dirname, '../config/db'));
const bcrypt = require('bcrypt');

// ============================================================
// LOGIN PAGE
// ============================================================
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Sign In - TODO LIST TIP TA RIDAR'
  });
});



// ============================================================
// LOGIN API
// ============================================================
router.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  try {
    // Find user by username
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Login successful - set session
    req.session.user = { id: user.id, username: user.username };
    console.log(`✅ User logged in: ${username}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: err.message
    });
  }
});



// ============================================================
// LOGOUT
// ============================================================
router.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ============================================================
// SESSION USER INFO
// ============================================================
router.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ success: true, user: req.session.user });
  }
  return res.status(401).json({ success: false, message: 'Not authenticated' });
});

module.exports = router;
