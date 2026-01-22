document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const body = document.body;

  if(!toggle) return;

  if(!body.classList.contains('sidebar-hidden')){
    body.classList.remove('sidebar-collapsed');
  }

  toggle.addEventListener('click', function(e){
    e.preventDefault();
    if(window.innerWidth <= 900){
      sidebar && sidebar.classList.toggle('open');
      return;
    }

    const collapsed = body.classList.toggle('sidebar-collapsed');
    if(sidebar){
      sidebar.classList.toggle('collapsed', collapsed);
    }
  });

  // close sidebar on outside click when overlay open (mobile)
  document.addEventListener('click', function(e){
    if(window.innerWidth > 900) return;
    if(!sidebar) return;
    if(!sidebar.classList.contains('open')) return;
    if(sidebar.contains(e.target) || (toggle && toggle.contains(e.target))) return;
    sidebar.classList.remove('open');
  });

});
