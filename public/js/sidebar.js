// Sidebar Toggle Logic - Mobile & Desktop
document.addEventListener('DOMContentLoaded', function() {
  const mobileToggle = document.getElementById('sidebarToggle');
  const desktopToggle = document.getElementById('sidebarToggleDesktop');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const body = document.body;

  if (!sidebar) {
    console.error('Sidebar element not found');
    return;
  }

  // Check screen size
  function isMobile() {
    return window.innerWidth <= 900;
  }

  // Close sidebar (mobile)
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  // Open sidebar (mobile)
  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  }

  // Toggle sidebar (mobile)
  function toggleSidebarMobile() {
    const isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function toggleSidebarDesktop() {
    body.classList.toggle('sidebar-collapsed');
    
    const isCollapsed = body.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
  }

  function restoreSidebarState() {
    if (!isMobile()) {
      const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      if (isCollapsed) {
        body.classList.add('sidebar-collapsed');
      }
    }
  }

  // ====== SUBMENU TOGGLE FUNCTION ======
  // ====== SUBMENU TOGGLE FUNCTION ======
    window.toggleSubmenu = function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const menuItem = event.currentTarget.closest('li.has-submenu');
      
      if (!menuItem) {
        console.error('❌ Menu item not found');
        return;
      }
      
      const wasActive = menuItem.classList.contains('active');
      
      console.log('🔄 Toggle submenu - Current state:', wasActive ? 'OPEN' : 'CLOSED');
      
      // Close all other submenus
      document.querySelectorAll('.menu li.has-submenu').forEach(item => {
        if (item !== menuItem) {
          item.classList.remove('active');
        }
      });
      
      // Toggle current submenu
      if (wasActive) {
        menuItem.classList.remove('active');
        console.log('✅ Submenu closed');
      } else {
        menuItem.classList.add('active');
        console.log('✅ Submenu opened');
      }
    };

  // Mobile toggle button click
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebarMobile();
    });
  }

  // Desktop toggle button click
  if (desktopToggle) {
    desktopToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (isMobile()) {
        closeSidebar();
      } else {
        toggleSidebarDesktop();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', function() {
      if (isMobile()) {
        closeSidebar();
      }
    });
  }

  // Click outside to close sidebar (mobile)
  document.addEventListener('click', function(e) {
    if (!isMobile()) return;
    if (!sidebar) return;
    if (!sidebar.classList.contains('open')) return;
    
    if (sidebar.contains(e.target)) return;
    if (mobileToggle && mobileToggle.contains(e.target)) return;
    
    closeSidebar();
  });

  // Resize handler
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (isMobile()) {
        body.classList.remove('sidebar-collapsed');
        closeSidebar();
      } else {
        restoreSidebarState();
      }
    }, 250);
  });

  // ====== SET ACTIVE MENU ITEM (WITH SUBMENU SUPPORT) ======
  function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuLinks = sidebar.querySelectorAll('.menu a');
    
    // Remove all active classes first
    menuLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Find and set active link (exact match or current path starts with href for subpages e.g. /dailyhouse/123)
    menuLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      // Handle query parameters - compare pathname only
      const hrefPath = href.split('?')[0];
      const exactMatch = hrefPath === currentPath || (currentPath === '/' && hrefPath === '/dashboard');
      const subpageMatch = hrefPath !== '/' && currentPath.startsWith(hrefPath + '/');
      if (exactMatch || subpageMatch) {
        link.classList.add('active');
        const parentSubmenu = link.closest('.submenu');
        if (parentSubmenu) {
          const parentMenuItem = parentSubmenu.closest('li.has-submenu');
          if (parentMenuItem) parentMenuItem.classList.add('active');
        }
      }
    });
  }

  // ====== MENU LINK CLICK HANDLER (WITH SUBMENU SUPPORT) ======
  const menuLinks = sidebar.querySelectorAll('.menu a:not(.menu-toggle)');
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Don't close sidebar if it's a submenu toggle
      if (link.classList.contains('menu-toggle')) {
        return;
      }
      
      // Close sidebar on mobile after clicking a real link
      if (isMobile()) {
        setTimeout(() => {
          closeSidebar();
        }, 200);
      }
    });
  });

  // Keyboard accessibility
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (isMobile() && sidebar.classList.contains('open')) {
        closeSidebar();
      }
      // Also close any open submenus
      document.querySelectorAll('.menu li.has-submenu').forEach(item => {
        item.classList.remove('active');
      });
    }
  });

  // Close submenu when clicking outside (desktop only)
  document.addEventListener('click', function(e) {
    if (isMobile()) return;
    
    // Don't close if clicking inside sidebar
    if (e.target.closest('.sidebar')) return;
    
    // Close all submenus
    document.querySelectorAll('.menu li.has-submenu').forEach(item => {
      item.classList.remove('active');
    });
  });

  // Initialize
  restoreSidebarState();
  setActiveMenuItem();

  console.log('✅ Sidebar initialized with submenu support');
});
