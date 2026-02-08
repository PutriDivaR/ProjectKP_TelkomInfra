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
// REGISTER PAGE
// ============================================================
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Create Account - TODO LIST TIP TA RIDAR'
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
// REGISTER API
// ============================================================
router.post('/api/auth/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Validation
  if (!username || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  try {
    // Check if username already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (username, password, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [username, hashedPassword]
    );

    console.log(`✅ New user registered: ${username} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.insertId,
        username: username
      }
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
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
