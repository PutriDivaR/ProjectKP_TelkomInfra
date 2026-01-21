document.addEventListener('DOMContentLoaded', function(){
  const botToggle = document.getElementById('botToggle');
  const chatPane = document.getElementById('chatPane');
  const closeChat = document.getElementById('closeChat');
  const sendChat = document.getElementById('sendChat');
  const chatInput = document.getElementById('chatInput');
  const chatBody = document.getElementById('chatBody');

  if(!botToggle || !chatPane) return;

  function openChat(){
    chatPane.classList.add('open');
    chatPane.setAttribute('aria-hidden','false');
    chatInput.focus();
  }

  function closeChatPane(){
    chatPane.classList.remove('open');
    chatPane.setAttribute('aria-hidden','true');
  }

  botToggle.addEventListener('click', function(){
    if(chatPane.classList.contains('open')) closeChatPane();
    else openChat();
  });

  if(closeChat) closeChat.addEventListener('click', closeChatPane);

  function appendMessage(text, sender){
    const msg = document.createElement('div');
    msg.style.margin = '8px 0';
    msg.style.display = 'flex';
    msg.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.textContent = text;
    bubble.style.maxWidth = '78%';
    bubble.style.padding = '8px 10px';
    bubble.style.borderRadius = '8px';
    bubble.style.background = sender === 'user' ? '#0b6fb3' : '#fff';
    bubble.style.color = sender === 'user' ? '#fff' : '#333';
    bubble.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';

    msg.appendChild(bubble);
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  if(sendChat){
    sendChat.addEventListener('click', function(){
      const v = chatInput.value && chatInput.value.trim();
      if(!v) return;
      appendMessage(v, 'user');
      chatInput.value = '';
      // simple canned response
      setTimeout(function(){
        appendMessage('Terima kasih, kami akan memproses pertanyaan Anda: "'+v+'"', 'bot');
      }, 700);
    });
  }

  chatInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      sendChat.click();
    }
  });

});
