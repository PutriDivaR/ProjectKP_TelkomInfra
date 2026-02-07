console.log('Kendala Pelanggan JS loaded');

var searchInput = document.getElementById('searchWonum');
if (searchInput) {
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.closest('form').submit();
    }
  });
}
