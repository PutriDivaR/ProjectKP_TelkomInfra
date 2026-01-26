document.addEventListener('DOMContentLoaded', function () {
 
  const $ = id => document.getElementById(id);
  const botToggle = $('botToggle');
  const chatPane = $('chatPane');
  const closeChat = $('closeChat');
  const sendChat = $('sendChat');
  const chatInput = $('chatInput');
  const chatBody = $('chatBody');

  // panel  chat botnya
  function appendMessage(text, sender = 'bot') {
    const msg = document.createElement('div');
    msg.style.margin = '8px 0';
    msg.style.display = 'flex';
    msg.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.innerHTML = text;
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '8px 10px';
    bubble.style.borderRadius = '8px';
    bubble.style.background = sender === 'user' ? '#0b6fb3' : '#ffffff';
    bubble.style.color = sender === 'user' ? '#fff' : '#333';

    msg.appendChild(bubble);
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    return msg; 
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  if (botToggle) botToggle.onclick = () => chatPane.classList.toggle('open');
  if (closeChat) closeChat.onclick = () => chatPane.classList.remove('open');

  async function sendMessage() {
    const keyword = (chatInput && chatInput.value || '').trim();
    if (!keyword) return;

    appendMessage(keyword, 'user');
    if (chatInput) chatInput.value = '';

    const loadingEl = appendMessage('⏳ Mengecek status tiket...', 'bot');

    try {
      const res = await fetch('/api/bot/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });

      let json = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON from /api/bot/check-status', parseErr);
        removeElement(loadingEl);
        appendMessage(`⚠️ Respon tidak valid dari server (status ${res.status})`, 'bot');
        return;
      }

      removeElement(loadingEl);

      if (!res.ok) {
        const serverMsg = json && json.message ? json.message : `HTTP ${res.status}`;
        appendMessage(`❌ ${serverMsg}`, 'bot');
        return;
      }

      if (!json.success) {
        appendMessage(`❌ ${json.message}`, 'bot');
        return;
      }

      const d = json.data;
      appendMessage(`
        <b>📄 Status Tiket</b><br>
        <b>WO:</b> ${d.wonum}<br>
        <b>Status:</b> ${d.status}<br>
        <b>STO:</b> ${d.sto}<br>
        <b>Paket:</b> ${d.package}<br>
        <b>Update:</b> ${new Date(d.updated_at).toLocaleString()}
      `, 'bot');

    } catch (err) {
      console.error('Network or other error when calling /api/bot/check-status', err);
      removeElement(loadingEl);
      appendMessage('⚠️ Gagal menghubungi server');
    }
  }

  if (sendChat) sendChat.onclick = sendMessage;
  if (chatInput) chatInput.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  // greeting awal
  appendMessage(`
    👋 Halo!  
    Saya Bot Status RIDAR  eaaak.  
    <br>Silakan masukkan salah satu dari berikut untuk memeriksa status tiket Anda:
    <ul>
      <li>Nomor WO</li>
      <li>Nomor Tiket</li>
    </ul>
  `, 'bot');
});
