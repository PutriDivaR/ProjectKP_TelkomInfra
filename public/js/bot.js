document.addEventListener('DOMContentLoaded', function () {
 
  const $ = id => document.getElementById(id);
  const botToggle = $('botToggle');
  const chatPane = $('chatPane');
  const closeChat = $('closeChat');
  const sendChat = $('sendChat');
  const chatInput = $('chatInput');
  const chatBody = $('chatBody');
  const clearHistory = $('clearHistory');
  const commandMenu = $('commandMenu');
  const commandSuggestions = $('commandSuggestions');
  const confirmPopup = $('confirmPopup');
  const confirmCancel = $('confirmCancel');
  const confirmDelete = $('confirmDelete');

  // Generate session ID (persistent per browser)
  let sessionId = localStorage.getItem('bot_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bot_session_id', sessionId);
  }

  // MESSAGE 
  function appendMessage(text, sender = 'bot', options = {}) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = text;

    msg.appendChild(bubble);
    chatBody.appendChild(msg);

    // Add quick replies if provided
    if (options.quickReplies && Array.isArray(options.quickReplies)) {
      appendQuickReplies(options.quickReplies);
    }

    chatBody.scrollTop = chatBody.scrollHeight;
    return msg;
  }

  function appendQuickReplies(replies) {
    // Remove any existing quick replies first
    const existing = chatBody.querySelectorAll('.quick-replies');
    existing.forEach(el => el.remove());

    const container = document.createElement('div');
    container.className = 'quick-replies';

    replies.forEach(reply => {
      const btn = document.createElement('button');
      btn.textContent = reply.label;
      btn.className = 'quick-reply-btn';
      btn.onclick = () => {
        chatInput.value = reply.value;
        container.remove();
        sendMessage();
      };
      container.appendChild(btn);
    });

    chatBody.appendChild(container);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'typingIndicator';
    typing.className = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'typing-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span>●</span><span>●</span><span>●</span></div>';

    typing.appendChild(bubble);
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;
    return typing;
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showConfirmPopup() {
    if (confirmPopup) {
      confirmPopup.classList.add('show');
      confirmPopup.setAttribute('aria-hidden', 'false');
    }
  }

  function hideConfirmPopup() {
    if (confirmPopup) {
      confirmPopup.classList.remove('show');
      confirmPopup.setAttribute('aria-hidden', 'true');
    }
  }


  // COMMAND SUGGESTIONS 
  async function showCommandSuggestions() {
    try {
      const res = await fetch('/api/bot/commands');
      const data = await res.json();

      if (data.success) {
        commandSuggestions.innerHTML = '';

        data.commands.forEach(cmd => {
          const item = document.createElement('div');
          item.className = 'command-suggestion-item';
          
          item.innerHTML = `
            <div class="cmd-icon">${cmd.emoji}</div>
            <div class="cmd-details">
              <div class="cmd-name">${cmd.cmd}</div>
              <div class="cmd-desc">${cmd.desc}</div>
            </div>
          `;
          
          // Klik langsung isi ke input dan kirim
          item.onclick = () => {
            chatInput.value = cmd.cmd;
            hideCommandSuggestions();
            sendMessage();
          };
          
          commandSuggestions.appendChild(item);
        });

        commandSuggestions.classList.add('show');
      }
    } catch (err) {
      console.error('Error fetching commands:', err);
    }
  }

  function hideCommandSuggestions() {
    commandSuggestions.classList.remove('show');
  }

  // SEND MESSAGE
  async function sendMessage() {
    const keyword = (chatInput && chatInput.value || '').trim();
    if (!keyword) return;

    hideCommandSuggestions();

    document.querySelectorAll('.quick-replies').forEach(el => el.remove());

    appendMessage(keyword, 'user');
    if (chatInput) chatInput.value = '';

    const typingIndicator = showTypingIndicator();

    try {
      const res = await fetch('/api/bot/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, sessionId })
      });

      let json = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON', parseErr);
        removeElement(typingIndicator);
        appendMessage(`⚠️ Respon tidak valid dari server`, 'bot');
        return;
      }

      removeElement(typingIndicator);

      if (!res.ok) {
        const serverMsg = json && json.message ? json.message : `HTTP ${res.status}`;
        appendMessage(`❌ ${serverMsg}`, 'bot');
        return;
      }

      if (json.command === 'clear') {
        await clearChatHistory();
        return;
      }

      const replies = (Array.isArray(json.quickReplies) && json.quickReplies.length)
        ? json.quickReplies
        : getDefaultNavReplies(keyword, json);

      appendMessage(json.message, 'bot', {
        quickReplies: replies
      });

    } catch (err) {
      console.error('Network error:', err);
      removeElement(typingIndicator);
      appendMessage('⚠️ Gagal menghubungi server. Periksa koneksi Anda.', 'bot');
    }
  }

  // Default navigation suggestions when backend doesn't provide any
  function getDefaultNavReplies(keyword, json) {
    const base = [
      { label: '📊 Dashboard', value: '/dashboard' },
      { label: '⚠️ Kendala Pelanggan', value: '/kendala' },
      { label: '👷 Kendala Teknisi', value: '/kendalateknik' },
      { label: '📝 Todolist', value: '/todolist' },
      { label: '❓ Help', value: '/help' }
    ];
    // Slightly contextual suggestions
    const isWoLike = /\bWO\d+|\d{6,}\b/i.test(keyword || '');
    if (isWoLike || /Status tiket ditemukan/i.test(json?.message || '')) {
      base.unshift({ label: '🔍 Detail Tiket', value: '/todolist' });
    }
    return base;
  }

  async function clearChatHistory() {
    try {
      const res = await fetch('/api/bot/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await res.json();
      
      // Clear chat display
      chatBody.innerHTML = '';
      
      appendMessage(data.message || '✅ Riwayat chat berhasil dihapus', 'bot');
      
      setTimeout(() => {
        showGreeting();
      }, 500);

    } catch (err) {
      console.error('Error clearing history:', err);
      appendMessage('⚠️ Gagal menghapus riwayat', 'bot');
    }
  }

  // LOAD CHAT HISTORY
  async function loadChatHistory() {
    try {
      const res = await fetch(`/api/bot/history/${sessionId}`);
      const data = await res.json();

      if (data.success && data.history && data.history.length > 0) {
        chatBody.innerHTML = '';
        
        data.history.forEach(item => {
          if (item.input_type === 'keyword' || item.input_type === 'command') {
            appendMessage(item.input_value, 'user');
            appendMessage(item.response_message || 'Response tidak tersedia', 'bot');
          }
        });

  appendMessage('<hr class="chat-history-divider"><small class="chat-history-label">--- Riwayat sebelumnya ---</small>', 'bot');
  // Tambahkan greeting baru agar tetap muncul setelah refresh tanpa clear
  showGreeting();
      } else {
        showGreeting();
      }
    } catch (err) {
      console.error('Error loading history:', err);
      showGreeting();
    }
  }

  // GREETING
  function showGreeting() {
    appendMessage(`
      👋 <b>Selamat datang di Bot RIDAR</b><br><br>
      Saya siap membantu Anda mengecek status tiket WO.<br><br>
      <b>💡 Cara menggunakan:</b><br>
      • Ketik nomor <b>WO</b> atau <b>Ticket ID</b> langsung<br>
      • Atau gunakan command <b>/help</b> untuk bantuan<br>
      • Klik tombol <b>menu (/)</b> untuk daftar command
    `, 'bot', {
      quickReplies: [
        { label: '❓ Help', value: '/help' },
        { label: '📊 Dashboard', value: '/dashboard' },
        { label: '📝 Cara Cek', value: '/cek' }
      ]
    });
  }

  if (botToggle) {
    botToggle.onclick = () => {
      chatPane.classList.toggle('open');
      if (chatPane.classList.contains('open')) {
        // Always ensure greeting/history are present on open
        if (chatBody.children.length === 0) {
          loadChatHistory();
        }
      }
    };
  }

  if (closeChat) {
    closeChat.onclick = () => {
      chatPane.classList.remove('open');
      hideCommandSuggestions();
    };
  }

  if (sendChat) {
    sendChat.onclick = sendMessage;
  }

  if (chatInput) {
    chatInput.onkeydown = e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };

    chatInput.oninput = e => {
      if (e.target.value === '') {
        hideCommandSuggestions();
      }
    };
  }

  if (clearHistory) {
    clearHistory.onclick = async (e) => {
      e.stopPropagation();
      showConfirmPopup();
    };
  }

  if (confirmCancel) {
    confirmCancel.onclick = (e) => {
      e.stopPropagation();
      hideConfirmPopup();
    };
  }

  if (confirmDelete) {
    confirmDelete.onclick = async (e) => {
      e.stopPropagation();
      hideConfirmPopup();
      await clearChatHistory();
    };
  }

  if (commandMenu) {
    commandMenu.onclick = (e) => {
      e.stopPropagation();
      if (commandSuggestions.classList.contains('show')) {
        hideCommandSuggestions();
      } else {
        showCommandSuggestions();
      }
    };
  }

  document.addEventListener('click', (e) => {
    if (!commandSuggestions.contains(e.target) && 
        !commandMenu.contains(e.target)) {
      hideCommandSuggestions();
    }
  });
});