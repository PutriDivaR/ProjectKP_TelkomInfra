
// ──────────────────────────────────────
// LOGIN PAGE
// ──────────────────────────────────────
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const btnLogin = document.getElementById('btnLogin');
  const errorMessage = document.getElementById('errorMessage');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Harap isi username dan password');
      return;
    }

    // Show loading state
    setButtonLoading(btnLogin, true);
    hideMessage(errorMessage);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Show success and redirect
  showSuccess('Login berhasil! Mengalihkan...');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showError(data.message || 'Login gagal');
        setButtonLoading(btnLogin, false);
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('Koneksi bermasalah. Coba lagi.');
      setButtonLoading(btnLogin, false);
    }
  });

  // Helper functions
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.className = 'error-message';
  }

  function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.className = 'success-message';
  }

  function hideMessage(element) {
    element.style.display = 'none';
  }
}

// ──────────────────────────────────────
// REGISTER PAGE
// ──────────────────────────────────────
function initRegisterPage() {
  const form = document.getElementById('registerForm');
  const btnRegister = document.getElementById('btnRegister');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Client-side validation
    if (!username || !password || !confirmPassword) {
      showError('Semua kolom wajib diisi');
      return;
    }

    if (password.length < 6) {
      showError('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      showError('Password tidak sama');
      return;
    }

    // Show loading state
    setButtonLoading(btnRegister, true);
    hideMessage(errorMessage);
    hideMessage(successMessage);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, confirmPassword })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
  showSuccessMessage('Akun berhasil dibuat! Mengalihkan ke halaman masuk...');
        
        // Clear form
        form.reset();
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showError(data.message || 'Pendaftaran gagal');
        setButtonLoading(btnRegister, false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('Koneksi bermasalah. Coba lagi.');
      setButtonLoading(btnRegister, false);
    }
  });

  // Helper functions
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }

  function showSuccessMessage(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }

  function hideMessage(element) {
    element.style.display = 'none';
  }
}

// ──────────────────────────────────────
// SHARED UTILITIES
// ──────────────────────────────────────
function setButtonLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');

  if (isLoading) {
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    button.disabled = true;
  } else {
    btnText.style.display = 'inline-block';
    btnLoader.style.display = 'none';
    button.disabled = false;
  }
}

// ──────────────────────────────────────
// CHECK AUTH STATUS
// ──────────────────────────────────────
function checkAuth() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkAuth, logout };
}
