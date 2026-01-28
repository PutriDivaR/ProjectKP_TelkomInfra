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

  document.addEventListener('click', function(e) {
    if (!isMobile()) return;
    if (!sidebar) return;
    if (!sidebar.classList.contains('open')) return;
    
    if (sidebar.contains(e.target)) return;
    if (mobileToggle && mobileToggle.contains(e.target)) return;
    
    closeSidebar();
  });

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

  function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuLinks = sidebar.querySelectorAll('.menu a');
    
    menuLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      
      if (href === currentPath || (currentPath === '/' && href === '/dashboard')) {
        link.classList.add('active');
      }
    });
  }

  const menuLinks = sidebar.querySelectorAll('.menu a');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (isMobile()) {
        setTimeout(() => {
          closeSidebar();
        }, 200);
      }
    });
  });

  // Keyboard accessibility
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });


  restoreSidebarState();
  setActiveMenuItem();

  console.log('✅ Sidebar initialized');
});