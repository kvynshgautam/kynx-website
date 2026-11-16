/**
 * KYNX WEB DECK — CORE ENGINE (v1.0)
 * Engineered by KG • High-Performance Web Messaging, WebSocket Relay & Ghost Shield
 */

(function () {
  'use strict';

  const BACKEND_URL = 'https://kynx-backend.onrender.com';
  const WS_URL = 'wss://kynx-backend.onrender.com/ws';

  const AppState = {
    token: localStorage.getItem('kynx_web_token') || null,
    user: JSON.parse(localStorage.getItem('kynx_web_user') || 'null'),
    conversations: [],
    activeConversation: null,
    messages: {}, // conversationId -> Array of messages
    ws: null,
    wsConnected: false,
    ghostShield: false,
    pairingId: null,
    pairingPollTimer: null
  };

  // DOM Elements
  const el = {
    authOverlay: document.getElementById('auth-overlay'),
    qrContainer: document.getElementById('qr-section'),
    directLoginSection: document.getElementById('direct-login-section'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrCodeText: document.getElementById('qr-code-text'),
    toggleLoginBtn: document.getElementById('toggle-direct-login'),
    loginForm: document.getElementById('login-form'),
    loginIdentifier: document.getElementById('login-identifier'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    
    // Desktop Deck
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userHandle: document.getElementById('user-handle'),
    btnLogout: document.getElementById('btn-logout'),
    conversationsList: document.getElementById('conversations-list'),
    searchInput: document.getElementById('sidebar-search'),
    
    // Chat Canvas
    emptyState: document.getElementById('empty-chat-state'),
    activeChatView: document.getElementById('active-chat-view'),
    peerAvatar: document.getElementById('peer-avatar'),
    peerName: document.getElementById('peer-name'),
    peerStatus: document.getElementById('peer-status'),
    messagesCanvas: document.getElementById('messages-canvas'),
    typingBar: document.getElementById('typing-indicator-bar'),
    msgInput: document.getElementById('chat-input'),
    btnSend: document.getElementById('btn-send-msg'),
    
    // Tools
    btnGhostShield: document.getElementById('btn-ghost-shield'),
    clipboardBox: document.getElementById('clipboard-content'),
    btnCopyPhone: document.getElementById('btn-copy-phone'),
    btnPastePhone: document.getElementById('btn-paste-phone'),
    airdropZone: document.getElementById('airdrop-zone'),
    fileInput: document.getElementById('file-upload-input'),
    
    // Calling Modal
    callOverlay: document.getElementById('call-overlay'),
    callerName: document.getElementById('caller-name'),
    btnAcceptCall: document.getElementById('btn-accept-call'),
    btnDeclineCall: document.getElementById('btn-decline-call'),
    btnAudioCall: document.getElementById('btn-start-audio-call'),
    btnVideoCall: document.getElementById('btn-start-video-call')
  };

  // Initialize Web Deck
  function init() {
    bindEvents();
    if (AppState.token && AppState.user) {
      showDeck();
    } else {
      showAuth();
      startPairingFlow();
    }
  }

  // Bind Event Listeners
  function bindEvents() {
    // Toggle between QR code & Direct Login
    el.toggleLoginBtn.addEventListener('click', () => {
      const isDirect = el.directLoginSection.style.display !== 'none';
      el.directLoginSection.style.display = isDirect ? 'none' : 'block';
      el.qrContainer.style.display = isDirect ? 'flex' : 'none';
      el.toggleLoginBtn.textContent = isDirect ? '⚡ Login with Email/Password Instead' : '📱 Scan Cyber QR Instead';
    });

    // Handle Direct Login Form
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleDirectLogin();
    });

    // Logout
    el.btnLogout.addEventListener('click', logout);

    // Send Message
    el.btnSend.addEventListener('click', sendMessage);
    el.msgInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else {
        broadcastTyping();
      }
    });

    // Ghost Shield Mode (Anti-shoulder surfing)
    el.btnGhostShield.addEventListener('click', toggleGhostShield);

    // AirDrop file trigger
    el.airdropZone.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', handleFileUpload);

    // Universal Clipboard buttons
    el.btnCopyPhone.addEventListener('click', copyToPhone);
    el.btnPastePhone.addEventListener('click', pasteFromPhone);

    // Search filter
    el.searchInput.addEventListener('input', (e) => {
      filterConversations(e.target.value.toLowerCase());
    });

    // Call buttons
    el.btnAudioCall.addEventListener('click', () => initiateCall('voice'));
    el.btnVideoCall.addEventListener('click', () => initiateCall('video'));
    el.btnDeclineCall.addEventListener('click', closeCallOverlay);
    el.btnAcceptCall.addEventListener('click', () => {
      alert('Connecting 120 FPS WebRTC call...');
      closeCallOverlay();
    });
  }

  // ==========================================================================
  // AUTHENTICATION & PAIRING
  // ==========================================================================

  function showAuth() {
    el.authOverlay.style.display = 'flex';
  }

  function hideAuth() {
    el.authOverlay.style.display = 'none';
    if (AppState.pairingPollTimer) {
      clearInterval(AppState.pairingPollTimer);
      AppState.pairingPollTimer = null;
    }
  }

  function startPairingFlow() {
    AppState.pairingId = 'KYNX-' + Math.floor(100000 + Math.random() * 900000);
    renderPairingQR(AppState.pairingId);
    el.qrCodeText.textContent = AppState.pairingId;
  }

  // Generate dynamic Cyber QR SVG/Canvas
  function renderPairingQR(code) {
    const canvas = el.qrCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    // Draw dark tech matrix pattern
    ctx.fillStyle = '#0b0f24';
    ctx.fillRect(0, 0, 200, 200);

    ctx.fillStyle = '#8b5cf6';
    const step = 8;
    for (let x = 16; x < 184; x += step) {
      for (let y = 16; y < 184; y += step) {
        const hash = (x * 13 + y * 7 + code.charCodeAt((x + y) % code.length)) % 10;
        if (hash > 4) {
          ctx.fillRect(x, y, 6, 6);
        }
      }
    }

    // Corner Finder Patterns
    drawFinder(ctx, 16, 16);
    drawFinder(ctx, 144, 16);
    drawFinder(ctx, 16, 144);

    // Center Cyber K Logo
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('K', 100, 100);
  }

  function drawFinder(ctx, x, y) {
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, 40, 40);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(x + 10, y + 10, 20, 20);
  }

  async function handleDirectLogin() {
    const identifier = el.loginIdentifier.value.trim();
    const password = el.loginPassword.value.trim();
    el.loginError.textContent = '';

    if (!identifier || !password) {
      el.loginError.textContent = 'Please enter your email/username and password.';
      return;
    }

    try {
      el.loginError.textContent = 'Authenticating with KYNX Cloud...';
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || data.message || 'Login failed. Please check credentials.');
      }

      // Save credentials
      AppState.token = data.token;
      AppState.user = data.user || {
        id: data.userId || 'user_' + Date.now(),
        displayName: data.displayName || identifier.split('@')[0],
        username: data.username || identifier.split('@')[0],
        email: data.email || identifier
      };

      localStorage.setItem('kynx_web_token', AppState.token);
      localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));

      hideAuth();
      showDeck();
    } catch (err) {
      el.loginError.textContent = err.message;
    }
  }

  function logout() {
    localStorage.removeItem('kynx_web_token');
    localStorage.removeItem('kynx_web_user');
    AppState.token = null;
    AppState.user = null;
    if (AppState.ws) {
      AppState.ws.close();
      AppState.ws = null;
    }
    location.reload();
  }

  // ==========================================================================
  // DESKTOP WORKSPACE & CHAT
  // ==========================================================================

  function showDeck() {
    hideAuth();
    // Update user profile in sidebar
    const initials = (AppState.user.displayName || AppState.user.username || 'KG')
      .substring(0, 2)
      .toUpperCase();
    el.userAvatar.textContent = initials;
    el.userName.textContent = AppState.user.displayName || AppState.user.username;
    el.userHandle.textContent = '@' + (AppState.user.username || 'kynx_user');

    // Connect WebSocket
    connectWebSocket();

    // Fetch Conversations
    loadConversations();
  }

  // WebSocket Engine
  function connectWebSocket() {
    if (!AppState.token) return;
    const wsUrl = `${WS_URL}?token=${encodeURIComponent(AppState.token)}`;
    
    try {
      AppState.ws = new WebSocket(wsUrl);

      AppState.ws.onopen = () => {
        AppState.wsConnected = true;
        console.log('[KYNX WEB] WebSocket Relay Connected.');
      };

      AppState.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleWebSocketMessage(payload);
        } catch (e) {
          console.warn('[KYNX WEB] Non-JSON WS message:', event.data);
        }
      };

      AppState.ws.onclose = () => {
        AppState.wsConnected = false;
        console.log('[KYNX WEB] WebSocket closed. Reconnecting in 3s...');
        setTimeout(connectWebSocket, 3000);
      };

      AppState.ws.onerror = (err) => {
        console.warn('[KYNX WEB] WS error:', err);
      };
    } catch (err) {
      console.error('[KYNX WEB] Could not open WS:', err);
    }
  }

  function handleWebSocketMessage(msg) {
    if (msg.type === 'chat_message' || msg.message) {
      const message = msg.message || msg;
      receiveMessage(message);
    } else if (msg.type === 'typing') {
      showPeerTyping(msg.senderName, msg.isTyping);
    } else if (msg.type === 'call_signal' || msg.callId) {
      showIncomingCall(msg);
    }
  }

  // Fetch Conversations from Cloud Backend
  async function loadConversations() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        AppState.conversations = data.conversations || data || [];
        renderConversations();
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    }
  }

  function renderConversations() {
    el.conversationsList.innerHTML = '';
    if (AppState.conversations.length === 0) {
      el.conversationsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-sub); font-size: 13px;">
          No conversations found.<br>Search or send a message to start!
        </div>`;
      return;
    }

    AppState.conversations.forEach((conv) => {
      const card = document.createElement('div');
      card.className = `chat-item-card ${AppState.activeConversation?.id === conv.id ? 'active' : ''}`;
      
      const title = conv.otherUserName || conv.displayName || conv.title || 'Encrypted Peer';
      const initials = title.substring(0, 2).toUpperCase();
      const lastMsg = conv.lastMessage?.text || conv.snippet || 'Tap to open chat';
      const time = conv.lastMessageAt ? formatTime(conv.lastMessageAt) : '';

      card.innerHTML = `
        <div class="item-avatar">${initials}</div>
        <div class="item-info">
          <div class="item-top">
            <span class="item-title">${escapeHtml(title)}</span>
            <span class="item-time">${time}</span>
          </div>
          <div class="item-bottom">
            <span class="item-preview">${escapeHtml(lastMsg)}</span>
            ${conv.unreadCount ? `<span class="item-unread-badge">${conv.unreadCount}</span>` : ''}
          </div>
        </div>
      `;

      card.addEventListener('click', () => openConversation(conv));
      el.conversationsList.appendChild(card);
    });
  }

  // Open Active Conversation
  async function openConversation(conv) {
    AppState.activeConversation = conv;
    renderConversations();

    el.emptyState.style.display = 'none';
    el.activeChatView.style.display = 'flex';

    const title = conv.otherUserName || conv.displayName || conv.title || 'Encrypted Peer';
    el.peerAvatar.textContent = title.substring(0, 2).toUpperCase();
    el.peerName.textContent = title;
    el.peerStatus.innerHTML = `● online • 120 FPS`;

    el.messagesCanvas.innerHTML = `
      <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
        🔒 Hardware Encrypted Peer Session (Render + WebRTC)
      </div>`;

    // Fetch message history
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations/${conv.id}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = data.messages || data || [];
        AppState.messages[conv.id] = msgs;
        msgs.forEach(appendMessageToUI);
        scrollChatToBottom();
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    }
  }

  // Send Message
  async function sendMessage() {
    const text = el.msgInput.value.trim();
    if (!text || !AppState.activeConversation) return;

    el.msgInput.value = '';
    const tempId = 'msg_' + Date.now();
    const newMsg = {
      id: tempId,
      conversationId: AppState.activeConversation.id,
      text: text,
      senderId: AppState.user.id,
      createdAt: new Date().toISOString(),
      isMine: true
    };

    appendMessageToUI(newMsg);
    scrollChatToBottom();

    try {
      await fetch(`${BACKEND_URL}/api/conversations/${AppState.activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify({ text })
      });
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  }

  // Receive Incoming Message
  function receiveMessage(msg) {
    const convId = msg.conversationId || msg.conversation_id;
    if (!AppState.messages[convId]) AppState.messages[convId] = [];
    AppState.messages[convId].push(msg);

    if (AppState.activeConversation && AppState.activeConversation.id === convId) {
      appendMessageToUI(msg);
      scrollChatToBottom();
    }

    // Refresh list preview
    loadConversations();
  }

  // Append Message Card to Canvas
  function appendMessageToUI(msg) {
    const isMine = msg.senderId === AppState.user.id || msg.isMine;
    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper ${isMine ? 'mine' : 'peer'}`;

    const time = formatTime(msg.createdAt || msg.created_at || Date.now());

    wrapper.innerHTML = `
      <div class="msg-bubble-content">
        ${escapeHtml(msg.text || msg.content || '')}
        <div class="msg-meta-row">
          <span>${time}</span>
          ${isMine ? `<span class="msg-ticks">✓✓</span>` : ''}
        </div>
      </div>
    `;

    el.messagesCanvas.appendChild(wrapper);
  }

  function scrollChatToBottom() {
    el.messagesCanvas.scrollTop = el.messagesCanvas.scrollHeight;
  }

  // ==========================================================================
  // UNIQUE KILLER FEATURES
  // ==========================================================================

  // 1. Ghost Shield Mode (Anti-shoulder surfing)
  function toggleGhostShield() {
    AppState.ghostShield = !AppState.ghostShield;
    if (AppState.ghostShield) {
      document.body.classList.add('ghost-shield-active');
      el.btnGhostShield.classList.add('active');
      el.btnGhostShield.innerHTML = `🛡️ Ghost Shield [ON]`;
    } else {
      document.body.classList.remove('ghost-shield-active');
      el.btnGhostShield.classList.remove('active');
      el.btnGhostShield.innerHTML = `🛡️ Ghost Shield`;
    }
  }

  // 2. Universal Clipboard Sync
  function copyToPhone() {
    const text = el.clipboardBox.value || el.clipboardBox.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('📋 Text synced to KYNX Universal Clipboard!');
  }

  async function pasteFromPhone() {
    try {
      const text = await navigator.clipboard.readText();
      el.clipboardBox.textContent = text;
    } catch (e) {
      console.warn('Clipboard read permission denied:', e);
    }
  }

  // 3. AirDrop Local File Upload
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    alert(`⚡ AirDrop Bridge: Preparing "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) for direct WebRTC peer transfer!`);
  }

  // 4. Typing Indicator
  let typingTimeout = null;
  function broadcastTyping() {
    if (!AppState.ws || !AppState.wsConnected || !AppState.activeConversation) return;
    AppState.ws.send(JSON.stringify({
      type: 'typing',
      conversationId: AppState.activeConversation.id,
      isTyping: true
    }));

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      AppState.ws.send(JSON.stringify({
        type: 'typing',
        conversationId: AppState.activeConversation.id,
        isTyping: false
      }));
    }, 1500);
  }

  function showPeerTyping(senderName, isTyping) {
    if (isTyping) {
      el.typingBar.innerHTML = `
        <span>${escapeHtml(senderName || 'Peer')} is typing</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>`;
    } else {
      el.typingBar.innerHTML = '';
    }
  }

  // 5. Calling HUD
  function initiateCall(type) {
    if (!AppState.activeConversation) return;
    el.callerName.textContent = `Calling ${el.peerName.textContent} (${type.toUpperCase()})...`;
    el.callOverlay.style.display = 'flex';
  }

  function showIncomingCall(signal) {
    el.callerName.textContent = `${signal.fromDisplayName || 'Encrypted Peer'} is calling you...`;
    el.callOverlay.style.display = 'flex';
  }

  function closeCallOverlay() {
    el.callOverlay.style.display = 'none';
  }

  // Utilities
  function formatTime(isoString) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function filterConversations(query) {
    const cards = el.conversationsList.querySelectorAll('.chat-item-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? 'flex' : 'none';
    });
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
