document.addEventListener('DOMContentLoaded', () => {
  const editBtn = document.getElementById('editBtn');
  const btnDone = document.getElementById('btnDone');
  const wrap = document.getElementById('daily-detail');
  if (!wrap) return;

  const wonum = wrap.dataset.wonum;

  // Fields (editable: lat, lang, package_name, status, status_akhir, sto, odp_todolist)
  const lat = document.getElementById('lat');
  const lang = document.getElementById('lang');
  const package_name = document.getElementById('package_name');
  const status = document.getElementById('status');
  const status_akhir = document.getElementById('status_akhir');
  const sto = document.getElementById('sto');
  const odp_todolist = document.getElementById('odp_todolist');

  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Keep original values for cancel
  const original = {
    lat: lat ? lat.value : '',
    lang: lang ? lang.value : '',
    package_name: package_name ? package_name.value : '',
    status: status ? status.value : '',
    status_akhir: status_akhir ? status_akhir.value : '',
    sto: sto ? sto.value : '',
    odp_todolist: odp_todolist ? odp_todolist.value : ''
  };

  let editing = false;

  async function setEditable(on) {
    // Make editable fields toggleable
    if (lat) lat.readOnly = !on;
    if (lang) lang.readOnly = !on;
    if (package_name) package_name.readOnly = !on;
    if (sto) sto.readOnly = !on;
    if (odp_todolist) odp_todolist.readOnly = !on;

    // status select/input toggle
    if (on && status && !document.getElementById('status_select')) {
      let statusList = ['WORKFAIL', 'CANCELWORK', 'COMPLETE', 'STARTWORK'];
      try {
        const r = await fetch('/dailyhouse/api/status');
        const j = await r.json();
        if (r.ok && j.success && Array.isArray(j.data)) statusList = j.data;
      } catch (err) {
        console.warn('status API failed, using defaults');
      }

      const select = document.createElement('select');
      select.id = 'status_select';
      select.classList.add('editable');
      statusList.forEach(s => {
        const o = document.createElement('option'); 
        o.value = s; 
        o.textContent = s;
        if (s === (status.value || '')) o.selected = true;
        select.appendChild(o);
      });
      status.parentNode.replaceChild(select, status);
    }

    // status_akhir select/input toggle
    if (on && status_akhir && !document.getElementById('status_akhir_select')) {
      let values = [];
      try {
        const r = await fetch('/dailyhouse/api/status-akhir');
        const j = await r.json();
        if (r.ok && j.success && Array.isArray(j.data) && j.data.length) values = j.data;
      } catch (err) {
        console.warn('status_akhir API failed');
      }

      const select = document.createElement('select');
      select.id = 'status_akhir_select';
      select.classList.add('editable');
      values.forEach(s => {
        const o = document.createElement('option'); 
        o.value = s; 
        o.textContent = s;
        if (s === (status_akhir.value || '')) o.selected = true;
        select.appendChild(o);
      });
      status_akhir.parentNode.replaceChild(select, status_akhir);
    }

    // Turn off: convert selects back to inputs
    if (!on) {
      const statusSelect = document.getElementById('status_select');
      if (statusSelect) {
        const input = document.createElement('input');
        input.id = 'status';
        input.readOnly = true;
        input.value = statusSelect.value;
        statusSelect.parentNode.replaceChild(input, statusSelect);
      }

      const statusAkhirSelect = document.getElementById('status_akhir_select');
      if (statusAkhirSelect) {
        const input = document.createElement('input');
        input.id = 'status_akhir';
        input.readOnly = true;
        input.value = statusAkhirSelect.value;
        statusAkhirSelect.parentNode.replaceChild(input, statusAkhirSelect);
      }
    }

    // UI toggle
    if (on) {
      editBtn.textContent = 'Cancel';
      editBtn.classList.add('btn-danger');
      if (btnDone) btnDone.style.display = '';
      lat && lat.classList.add('editable');
      lang && lang.classList.add('editable');
      package_name && package_name.classList.add('editable');
      sto && sto.classList.add('editable');
      odp_todolist && odp_todolist.classList.add('editable');
      if (document.getElementById('status_select')) document.getElementById('status_select').classList.add('editable');
      if (document.getElementById('status_akhir_select')) document.getElementById('status_akhir_select').classList.add('editable');
    } else {
      editBtn.textContent = '✎ Edit';
      editBtn.classList.remove('btn-danger');
      if (btnDone) btnDone.style.display = 'none';
      lat && lat.classList.remove('editable');
      lang && lang.classList.remove('editable');
      package_name && package_name.classList.remove('editable');
      sto && sto.classList.remove('editable');
      odp_todolist && odp_todolist.classList.remove('editable');
      if (document.getElementById('status_select')) document.getElementById('status_select').classList.remove('editable');
      if (document.getElementById('status_akhir_select')) document.getElementById('status_akhir_select').classList.remove('editable');
    }
  }

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      editing = !editing;
      if (!editing) {
        // Cancel edits: reset values
        if (lat) lat.value = original.lat;
        if (lang) lang.value = original.lang;
        if (package_name) package_name.value = original.package_name;
        if (status) status.value = original.status;
        if (status_akhir) status_akhir.value = original.status_akhir;
        if (sto) sto.value = original.sto;
        if (odp_todolist) odp_todolist.value = original.odp_todolist;
        setEditable(false);
      } else {
        setEditable(true);
      }
    });
  }

  if (btnDone) {
    btnDone.addEventListener('click', async () => {
      btnDone.disabled = true;
      const payload = {
        lat: lat ? lat.value : '',
        lang: lang ? lang.value : '',
        package_name: package_name ? package_name.value : '',
        status: (document.getElementById('status_select') ? document.getElementById('status_select').value : (status ? status.value : '')),
        status_akhir: (document.getElementById('status_akhir_select') ? document.getElementById('status_akhir_select').value : (status_akhir ? status_akhir.value : '')),
        sto: sto ? sto.value : '',
        odp_todolist: odp_todolist ? odp_todolist.value : ''
      };

      try {
        const res = await fetch(`/dailyhouse/update/${wonum}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update');

        showToast('data berhasil di update', 'success');
        setTimeout(() => location.reload(), 700);
      } catch (err) {
        console.error(err);
        showToast('Gagal update: ' + (err.message||'Unknown'), 'error');
      } finally {
        btnDone.disabled = false;
      }
    });
  }
});
