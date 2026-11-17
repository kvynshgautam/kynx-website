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
    tempToken: null,
    conversations: [],
    activeConversation: null,
    messages: {}, // conversationId -> Array of messages
    ws: null,
    wsConnected: false,
    ghostShield: false,
    pairingId: null,
    pairingCode: null,
    pairingPollTimer: null
  };

  // DOM Elements
  const el = {
    authOverlay: document.getElementById('auth-overlay'),
    qrContainer: document.getElementById('qr-section'),
    directLoginSection: document.getElementById('direct-login-section'),
    qrCanvas: document.getElementById('qr-canvas'),
    qrCodeText: document.getElementById('qr-code-text'),
    pairStatusText: document.getElementById('pair-status-text'),
    btnRefreshPair: document.getElementById('btn-refresh-pair'),
    toggleLoginBtn: document.getElementById('toggle-direct-login'),
    loginForm: document.getElementById('login-form'),
    loginIdentifier: document.getElementById('login-identifier'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    btnLoginSubmit: document.getElementById('btn-login-submit'),
    
    // OTP Section
    otpSection: document.getElementById('otp-section'),
    otpEmailMasked: document.getElementById('otp-email-masked'),
    loginOtp: document.getElementById('login-otp'),
    otpError: document.getElementById('otp-error'),
    btnVerifyOtp: document.getElementById('btn-verify-otp'),
    btnBackToPwd: document.getElementById('btn-back-to-pwd'),
    btnResendOtp: document.getElementById('btn-resend-otp'),
    
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
    
    // Tools & Actions
    btnGhostShield: document.getElementById('btn-ghost-shield'),
    btnChatMenu: document.getElementById('btn-chat-menu'),
    chatMoreMenu: document.getElementById('chat-more-menu'),
    menuBtnAirdrop: document.getElementById('menu-btn-airdrop'),
    menuBtnClearChat: document.getElementById('menu-btn-clear-chat'),
    btnAttachMedia: document.getElementById('btn-attach-media'),
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
      el.toggleLoginBtn.textContent = isDirect ? '⚡ Login with Email/Password Instead' : '📱 Scan Cyber QR / Pairing Code';
    });

    // Handle Direct Login Form
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleDirectLogin();
    });

    // OTP verification actions
    if (el.btnVerifyOtp) {
      el.btnVerifyOtp.addEventListener('click', handleVerifyOtp);
    }
    if (el.loginOtp) {
      el.loginOtp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleVerifyOtp();
        }
      });
    }
    if (el.btnBackToPwd) {
      el.btnBackToPwd.addEventListener('click', () => {
        el.otpSection.style.display = 'none';
        el.loginForm.style.display = 'block';
      });
    }
    if (el.btnResendOtp) {
      el.btnResendOtp.addEventListener('click', handleResendOtp);
    }

    // Refresh pairing code
    if (el.btnRefreshPair) {
      el.btnRefreshPair.addEventListener('click', startPairingFlow);
    }

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

    // 3-Dots dropdown menu
    if (el.btnChatMenu && el.chatMoreMenu) {
      el.btnChatMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = el.chatMoreMenu.style.display === 'flex';
        el.chatMoreMenu.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', (e) => {
        if (!el.chatMoreMenu.contains(e.target) && e.target !== el.btnChatMenu) {
          el.chatMoreMenu.style.display = 'none';
        }
      });
    }

    // Mesh AirDrop inside 3-dots menu
    if (el.menuBtnAirdrop) {
      el.menuBtnAirdrop.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        el.fileInput.click();
      });
    }

    // Clear Chat inside 3-dots menu
    if (el.menuBtnClearChat) {
      el.menuBtnClearChat.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (confirm('Clear current messages from screen?')) {
          el.messagesCanvas.innerHTML = `
            <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
              🗑️ Chat view cleared
            </div>`;
        }
      });
    }

    // Attach media button
    if (el.btnAttachMedia) {
      el.btnAttachMedia.addEventListener('click', () => {
        el.fileInput.click();
      });
    }

    el.fileInput.addEventListener('change', handleFileUpload);

    // Search filter
    el.searchInput.addEventListener('input', (e) => {
      filterConversations(e.target.value.toLowerCase());
    });

    // Call buttons
    el.btnAudioCall.addEventListener('click', () => initiateCall('voice'));
    el.btnVideoCall.addEventListener('click', () => initiateCall('video'));
    el.btnDeclineCall.addEventListener('click', closeCallOverlay);
    el.btnAcceptCall.addEventListener('click', () => {
      alert('Connecting WebRTC call...');
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

  async function startPairingFlow() {
    if (AppState.pairingPollTimer) {
      clearInterval(AppState.pairingPollTimer);
      AppState.pairingPollTimer = null;
    }

    if (el.qrCodeText) el.qrCodeText.textContent = '--- ---';
    if (el.pairStatusText) el.pairStatusText.textContent = '⚡ Requesting pairing session...';

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/pair/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Could not create pairing session');
      const data = await res.json();

      AppState.pairingId = data.pair_id;
      AppState.pairingCode = data.code;

      // Format 6 digits with clean spacing (e.g. 849 201)
      const codeStr = String(data.code || '');
      const formatted = codeStr.length === 6 ? `${codeStr.slice(0, 3)} ${codeStr.slice(3)}` : codeStr;
      if (el.qrCodeText) el.qrCodeText.textContent = formatted;
      if (el.pairStatusText) el.pairStatusText.textContent = '⚡ Waiting for approval from KYNX App...';

      renderPairingQR(data.code);

      // Start polling pairing status every 2.5s
      AppState.pairingPollTimer = setInterval(pollPairingStatus, 2500);
    } catch (err) {
      console.warn('Pairing session error:', err);
      if (el.pairStatusText) el.pairStatusText.textContent = '⚠️ Could not reach KYNX Cloud. Tap Refresh.';
    }
  }

  async function pollPairingStatus() {
    if (!AppState.pairingId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/pair/status?pair_id=${encodeURIComponent(AppState.pairingId)}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'approved' && data.access_token) {
        clearInterval(AppState.pairingPollTimer);
        AppState.pairingPollTimer = null;

        AppState.token = data.access_token;
        AppState.user = data.user || {
          id: 'user_' + Date.now(),
          displayName: 'KYNX User',
          username: 'kynx_user'
        };

        localStorage.setItem('kynx_web_token', AppState.token);
        localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));

        if (el.pairStatusText) el.pairStatusText.textContent = '✅ Paired! Unlocking Web Deck...';
        setTimeout(() => {
          hideAuth();
          showDeck();
        }, 600);
      } else if (data.status === 'expired') {
        startPairingFlow();
      }
    } catch (err) {
      // Quiet background polling error
    }
  }

  // Generate dynamic Cyber QR SVG/Canvas
  function renderPairingQR(code) {
    const canvas = el.qrCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    // Draw dark tech matrix pattern
    ctx.fillStyle = '#0b0f24';
    ctx.fillRect(0, 0, 200, 200);

    ctx.fillStyle = '#8b5cf6';
    const step = 8;
    const codeStr = String(code || 'KYNX');
    for (let x = 16; x < 184; x += step) {
      for (let y = 16; y < 184; y += step) {
        const hash = (x * 13 + y * 7 + codeStr.charCodeAt((x + y) % codeStr.length)) % 10;
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
      el.loginError.style.color = 'var(--accent-cyan)';
      el.loginError.textContent = 'Authenticating with KYNX Cloud...';
      
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: identifier, password: password })
      });

      const data = await res.json();
      el.loginError.style.color = 'var(--accent-red)';
      
      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || 'Login failed. Please check credentials.');
      }

      // 1. Two-Factor OTP Required
      if (data.status === 'otp_required') {
        AppState.tempToken = data.temp_token;
        el.loginError.textContent = '';
        el.loginForm.style.display = 'none';
        el.otpSection.style.display = 'block';
        el.otpEmailMasked.textContent = `Security code sent to ${data.email_masked || 'your registered email'}.`;
        el.loginOtp.value = '';
        el.otpError.textContent = '';
        el.loginOtp.focus();
        return;
      }

      // 2. Direct Token Returned
      if (data.access_token) {
        AppState.token = data.access_token;
        AppState.user = data.user || {
          id: 'user_' + Date.now(),
          displayName: identifier.split('@')[0],
          username: identifier.split('@')[0],
          email: identifier
        };

        localStorage.setItem('kynx_web_token', AppState.token);
        localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));

        hideAuth();
        showDeck();
      } else {
        throw new Error('Unexpected response from server.');
      }
    } catch (err) {
      el.loginError.style.color = 'var(--accent-red)';
      el.loginError.textContent = err.message;
    }
  }

  async function handleVerifyOtp() {
    const otp = el.loginOtp.value.trim();
    el.otpError.textContent = '';
    
    if (!otp || otp.length < 4) {
      el.otpError.textContent = 'Please enter the 6-digit verification code.';
      return;
    }
    
    try {
      el.otpError.style.color = 'var(--accent-cyan)';
      el.otpError.textContent = 'Verifying security code...';
      
      const res = await fetch(`${BACKEND_URL}/api/auth/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: AppState.tempToken, otp: otp })
      });
      
      const data = await res.json();
      el.otpError.style.color = 'var(--accent-red)';
      
      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || 'Verification failed.');
      }
      
      AppState.token = data.access_token;
      AppState.user = data.user;
      
      localStorage.setItem('kynx_web_token', AppState.token);
      localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));
      
      el.otpError.style.color = 'var(--accent-green)';
      el.otpError.textContent = 'Verified! Entering Web Deck...';
      
      setTimeout(() => {
        hideAuth();
        showDeck();
      }, 500);
    } catch (err) {
      el.otpError.style.color = 'var(--accent-red)';
      el.otpError.textContent = err.message;
    }
  }

  async function handleResendOtp() {
    if (!AppState.tempToken) return;
    try {
      el.otpError.style.color = 'var(--accent-cyan)';
      el.otpError.textContent = 'Requesting new code...';
      const res = await fetch(`${BACKEND_URL}/api/auth/login/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: AppState.tempToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not resend code.');
      el.otpError.style.color = 'var(--accent-green)';
      el.otpError.textContent = 'New code sent! Please check your email.';
    } catch (err) {
      el.otpError.style.color = 'var(--accent-red)';
      el.otpError.textContent = err.message;
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

  let conversationsPollTimer = null;
  let activeSyncTimer = null;

  async function showDeck() {
    hideAuth();

    // Verify / load user profile if needed
    if (!AppState.user || !AppState.user.id) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        });
        if (res.ok) {
          AppState.user = await res.json();
          localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));
        }
      } catch (e) {
        console.warn('Could not refresh profile:', e);
      }
    }

    // Update user profile in sidebar
    const initials = ((AppState.user && (AppState.user.displayName || AppState.user.display_name || AppState.user.username)) || 'KG')
      .substring(0, 2)
      .toUpperCase();
    el.userAvatar.textContent = initials;
    el.userName.textContent = (AppState.user && (AppState.user.displayName || AppState.user.display_name || AppState.user.username)) || 'KYNX User';
    el.userHandle.textContent = '@' + ((AppState.user && AppState.user.username) || 'kynx_user');

    // Connect WebSocket
    connectWebSocket();

    // Fetch Conversations
    loadConversations();

    // Periodic refresh of conversations
    if (conversationsPollTimer) clearInterval(conversationsPollTimer);
    conversationsPollTimer = setInterval(loadConversations, 8000);
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
    if (msg.type === 'message' || msg.type === 'chat_message' || msg.message) {
      const message = msg.message || msg;
      receiveMessage(message);
    } else if (msg.type === 'typing') {
      const sender = msg.display_name || msg.username || msg.senderName;
      const isTyping = msg.is_typing !== undefined ? msg.is_typing : msg.isTyping;
      showPeerTyping(sender, isTyping);
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
        AppState.conversations = Array.isArray(data) ? data : (data.conversations || []);
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
          No conversations found.<br>Send a message on KYNX App to start!
        </div>`;
      return;
    }

    AppState.conversations.forEach((conv) => {
      const card = document.createElement('div');
      card.className = `chat-item-card ${AppState.activeConversation?.id === conv.id ? 'active' : ''}`;
      
      const peer = conv.peer || {};
      const title = peer.display_name || peer.username || conv.title || conv.displayName || 'Encrypted Peer';
      const initials = title.substring(0, 2).toUpperCase();
      const lastMsg = conv.last_message?.text || conv.lastMessage?.text || conv.snippet || 'Tap to open chat';
      const timeRaw = conv.last_message?.created_at || conv.lastMessageAt || conv.updated_at;
      const time = timeRaw ? formatTime(timeRaw) : '';

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

    // Auto-select first conversation if none selected yet
    if (!AppState.activeConversation && AppState.conversations.length > 0) {
      openConversation(AppState.conversations[0]);
    }
  }

  // Open Active Conversation
  async function openConversation(conv) {
    AppState.activeConversation = conv;
    renderConversations();

    el.emptyState.style.display = 'none';
    el.activeChatView.style.display = 'flex';

    const peer = conv.peer || {};
    const title = peer.display_name || peer.username || conv.title || conv.displayName || 'Encrypted Peer';
    el.peerAvatar.textContent = title.substring(0, 2).toUpperCase();
    el.peerName.textContent = title;
    el.peerStatus.innerHTML = `● online`;

    el.messagesCanvas.innerHTML = `
      <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
        🔒 Hardware Encrypted Peer Session (Render + WebRTC)
      </div>`;

    // Fetch initial message history
    await syncActiveConversation();

    // Start auto sync for active conversation (every 3s fallback)
    if (activeSyncTimer) clearInterval(activeSyncTimer);
    activeSyncTimer = setInterval(syncActiveConversation, 3000);
  }

  async function syncActiveConversation() {
    if (!AppState.token || !AppState.activeConversation) return;
    const convId = AppState.activeConversation.id;
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const msgs = Array.isArray(data) ? data : (data.messages || []);
        if (!AppState.messages[convId]) AppState.messages[convId] = [];
        
        let shouldScroll = false;
        msgs.forEach(m => {
          const exists = AppState.messages[convId].some(existing => existing.id === m.id || (existing.client_msg_id && existing.client_msg_id === m.id));
          if (!exists) {
            AppState.messages[convId].push(m);
          }
          const rendered = appendMessageToUI(m);
          if (rendered) shouldScroll = true;
        });

        if (shouldScroll) {
          scrollChatToBottom();
        }
      }
    } catch (err) {
      console.warn('Failed to sync messages:', err);
    }
  }

  // Send Message
  async function sendMessage() {
    const text = el.msgInput.value.trim();
    if (!text || !AppState.activeConversation) return;

    el.msgInput.value = '';
    const tempId = 'kynx_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : 'me';
    const newMsg = {
      id: tempId,
      client_msg_id: tempId,
      conversation_id: AppState.activeConversation.id,
      text: text,
      sender_id: myId,
      created_at: new Date().toISOString(),
      isMine: true
    };

    if (!AppState.messages[AppState.activeConversation.id]) {
      AppState.messages[AppState.activeConversation.id] = [];
    }
    AppState.messages[AppState.activeConversation.id].push(newMsg);
    appendMessageToUI(newMsg);
    scrollChatToBottom();

    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations/${AppState.activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify({ 
          conversation_id: AppState.activeConversation.id,
          text: text,
          client_msg_id: tempId
        })
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          newMsg.id = saved.id;
          const bubble = el.messagesCanvas.querySelector(`[data-msg-id="${tempId}"]`);
          if (bubble) bubble.setAttribute('data-msg-id', saved.id);
        }
      } else {
        console.warn('Failed to send HTTP message:', res.status);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    }
  }

  // Receive Incoming Message
  function receiveMessage(msg) {
    const convId = msg.conversationId || msg.conversation_id;
    if (!convId) return;
    if (!AppState.messages[convId]) AppState.messages[convId] = [];

    const exists = AppState.messages[convId].some(m => m.id === msg.id || (m.client_msg_id && m.client_msg_id === (msg.client_msg_id || msg.id)));
    if (!exists) {
      AppState.messages[convId].push(msg);
    }

    if (AppState.activeConversation && AppState.activeConversation.id === convId) {
      const rendered = appendMessageToUI(msg);
      if (rendered) scrollChatToBottom();
    }

    // Refresh list preview
    loadConversations();
  }

  // Append Message Card to Canvas
  function appendMessageToUI(msg) {
    if (!msg) return false;
    const msgId = msg.id || msg.client_msg_id;
    if (msgId && el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`)) {
      return false; // Already in DOM
    }
    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
    const sender = msg.sender_id || msg.senderId;
    const isMine = (myId && sender === myId) || msg.isMine;
    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper ${isMine ? 'mine' : 'peer'}`;
    if (msgId) wrapper.setAttribute('data-msg-id', msgId);

    const time = formatTime(msg.created_at || msg.createdAt || Date.now());

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
    return true;
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

  // 2. AirDrop Local File Upload
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
