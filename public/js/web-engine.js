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
    activeTab: 'chats',
    searchQuery: '',
    replyTo: null,
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
    btnInstallPwa: document.getElementById('btn-install-pwa'),
    btnLogout: document.getElementById('btn-logout'),
    btnToggleNotif: document.getElementById('btn-toggle-notif'),
    conversationsList: document.getElementById('conversations-list'),
    searchInput: document.getElementById('sidebar-search'),
    
    // Chat Canvas
    webApp: document.getElementById('web-app'),
    deckMainChat: document.getElementById('deck-main-chat'),
    chatDropOverlay: document.getElementById('chat-drop-overlay'),
    btnMobileBack: document.getElementById('btn-mobile-back'),
    emptyState: document.getElementById('empty-chat-state'),
    activeChatView: document.getElementById('active-chat-view'),
    peerAvatar: document.getElementById('peer-avatar'),
    peerName: document.getElementById('peer-name'),
    peerStatus: document.getElementById('peer-status'),
    messagesCanvas: document.getElementById('messages-canvas'),
    typingBar: document.getElementById('typing-indicator-bar'),
    replyPreviewBar: document.getElementById('reply-preview-bar'),
    replyPreviewSender: document.getElementById('reply-preview-sender'),
    replyPreviewText: document.getElementById('reply-preview-text'),
    btnCancelReply: document.getElementById('btn-cancel-reply'),
    btnEmojiPicker: document.getElementById('btn-emoji-picker'),
    emojiPickerPopover: document.getElementById('emoji-picker-popover'),
    btnRecordVoice: document.getElementById('btn-record-voice'),
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
    
    // WebRTC Calling Modal HUD
    callOverlay: document.getElementById('call-overlay'),
    callTypeBadge: document.getElementById('call-type-badge'),
    callTypeText: document.getElementById('call-type-text'),
    btnCallMinimize: document.getElementById('btn-call-minimize'),
    callVideoStage: document.getElementById('call-video-stage'),
    remoteVideo: document.getElementById('remote-video'),
    localVideo: document.getElementById('local-video'),
    videoPeerName: document.getElementById('video-peer-name'),
    videoCallStatus: document.getElementById('video-call-status'),
    callAudioCard: document.getElementById('call-audio-card'),
    callAvatarContainer: document.getElementById('call-avatar-container'),
    callAvatarInitials: document.getElementById('call-avatar-initials'),
    callerName: document.getElementById('caller-name'),
    callStatus: document.getElementById('call-status'),
    callTimer: document.getElementById('call-timer'),
    remoteAudio: document.getElementById('remote-audio'),
    ringtoneAudio: document.getElementById('kynx-ringtone-audio'),
    callControlsDock: document.getElementById('call-controls-dock'),
    callIncomingActions: document.getElementById('call-incoming-actions'),
    callActiveActions: document.getElementById('call-active-actions'),
    btnAcceptCall: document.getElementById('btn-accept-call'),
    btnDeclineCall: document.getElementById('btn-decline-call'),
    btnCallMuteMic: document.getElementById('btn-call-mute-mic'),
    iconMicOn: document.getElementById('icon-mic-on'),
    iconMicOff: document.getElementById('icon-mic-off'),
    btnCallToggleCam: document.getElementById('btn-call-toggle-cam'),
    btnCallShareScreen: document.getElementById('btn-call-share-screen'),
    iconCamOn: document.getElementById('icon-cam-on'),
    iconCamOff: document.getElementById('icon-cam-off'),
    btnCallHangup: document.getElementById('btn-call-hangup'),
    callMinimizedBar: document.getElementById('call-minimized-bar'),
    callMinAvatar: document.getElementById('call-min-avatar'),
    callMinName: document.getElementById('call-min-name'),
    callMinTimer: document.getElementById('call-min-timer'),
    btnMinExpand: document.getElementById('btn-min-expand'),
    btnMinHangup: document.getElementById('btn-min-hangup'),
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

    // Notification permission & test chime toggle
    if (el.btnToggleNotif) {
      el.btnToggleNotif.addEventListener('click', async () => {
        playNotificationSound();
        const perm = await requestNotificationPermission();
        if (perm === 'granted') {
          showHeadsUpCard('KYNX Notification Active', 'Instant sound & desktop alerts enabled just like your phone!', AppState.activeConversation?.id);
        } else if (perm === 'denied') {
          alert('Notification permission is blocked in your browser. Please click the lock/settings icon in your browser URL bar and allow Notifications.');
        }
      });
    }

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
      el.menuBtnClearChat.addEventListener('click', async () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (!AppState.activeConversation) return;
        if (!confirm('Clear this chat permanently for you?')) return;
        const convId = AppState.activeConversation.id;
        try {
          await fetch(`${BACKEND_URL}/api/conversations/${convId}?for_everyone=false`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AppState.token}` }
          });
        } catch (err) {
          console.warn('Clear chat API error:', err);
        }
        AppState.messages[convId] = [];
        el.messagesCanvas.innerHTML = `
          <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
            🗑️ Chat cleared
          </div>`;
        loadConversations();
      });
    }

    // Attach media button
    if (el.btnAttachMedia) {
      el.btnAttachMedia.addEventListener('click', () => {
        el.fileInput.click();
      });
    }

    if (el.btnRecordVoice) {
      el.btnRecordVoice.addEventListener('click', toggleVoiceRecording);
    }

    if (el.btnCancelReply) {
      el.btnCancelReply.addEventListener('click', clearReplyTarget);
    }

    if (el.btnMobileBack) {
      el.btnMobileBack.addEventListener('click', () => {
        if (el.webApp) el.webApp.classList.remove('mobile-chat-open');
      });
    }

    if (el.btnEmojiPicker) {
      el.btnEmojiPicker.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEmojiPicker();
      });
      document.addEventListener('click', (e) => {
        if (el.emojiPickerPopover && el.emojiPickerPopover.style.display !== 'none' &&
            !el.emojiPickerPopover.contains(e.target) && e.target !== el.btnEmojiPicker) {
          el.emojiPickerPopover.style.display = 'none';
        }
      });
    }

    // Ctrl+V Instant Screenshot / Image / File Paste
    document.addEventListener('paste', (e) => {
      if (!AppState.activeConversation || !AppState.token) return;
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            uploadAndSendFile(file);
            return;
          }
        }
      }
    });

    // Drag & Drop Instant Media Teleport onto Chat Area
    if (el.deckMainChat) {
      let dragDepth = 0;
      el.deckMainChat.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (!AppState.activeConversation) return;
        dragDepth++;
        if (el.chatDropOverlay) el.chatDropOverlay.style.display = 'flex';
      });
      el.deckMainChat.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      el.deckMainChat.addEventListener('dragleave', () => {
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0 && el.chatDropOverlay) {
          el.chatDropOverlay.style.display = 'none';
        }
      });
      el.deckMainChat.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDepth = 0;
        if (el.chatDropOverlay) el.chatDropOverlay.style.display = 'none';
        if (!AppState.activeConversation) return;
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) {
          uploadAndSendFile(files[0]);
        }
      });
    }

    // Installable Desktop App (PWA) Registration & 1-Click Prompt
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    let deferredPwaPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      if (el.btnInstallPwa) el.btnInstallPwa.style.display = 'inline-flex';
    });
    if (el.btnInstallPwa) {
      el.btnInstallPwa.addEventListener('click', async () => {
        if (!deferredPwaPrompt) return;
        deferredPwaPrompt.prompt();
        const choice = await deferredPwaPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
        if (choice.outcome === 'accepted') {
          el.btnInstallPwa.style.display = 'none';
          showHeadsUpCard('KYNX Desktop Installed 💻', 'Launch KYNX anytime from your taskbar or desktop!');
        }
        deferredPwaPrompt = null;
      });
    }

    el.fileInput.addEventListener('change', handleFileUpload);

    // Search filter
    el.searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.toLowerCase();
      filterConversations(AppState.searchQuery);
    });

    // WebRTC Calling Buttons & Controls
    if (el.btnAudioCall) el.btnAudioCall.addEventListener('click', () => initiateCall('voice'));
    if (el.btnVideoCall) el.btnVideoCall.addEventListener('click', () => initiateCall('video'));
    if (el.btnAcceptCall) el.btnAcceptCall.addEventListener('click', acceptIncomingCall);
    if (el.btnDeclineCall) el.btnDeclineCall.addEventListener('click', declineIncomingCall);
    if (el.btnCallMuteMic) el.btnCallMuteMic.addEventListener('click', toggleCallMute);
    if (el.btnCallToggleCam) el.btnCallToggleCam.addEventListener('click', toggleCallVideo);
    if (el.btnCallShareScreen) el.btnCallShareScreen.addEventListener('click', toggleScreenShare);
    if (el.btnCallHangup) el.btnCallHangup.addEventListener('click', () => endCall('Call ended'));
    if (el.btnCallMinimize) el.btnCallMinimize.addEventListener('click', toggleCallMinimize);
    if (el.btnMinExpand) el.btnMinExpand.addEventListener('click', toggleCallMinimize);
    if (el.btnMinHangup) el.btnMinHangup.addEventListener('click', () => endCall('Call ended'));

    // Sidebar navigation tabs (Chats, Calls, Contacts)
    document.querySelectorAll('.sidebar-nav-tabs .nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav-tabs .nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.textContent.trim().toLowerCase();
        if (tabName.includes('chats')) {
          AppState.activeTab = 'chats';
          renderConversations();
          if (AppState.searchQuery) filterConversations(AppState.searchQuery);
        } else if (tabName.includes('calls')) {
          AppState.activeTab = 'calls';
          loadAndRenderCalls();
        } else if (tabName.includes('contacts')) {
          AppState.activeTab = 'contacts';
          loadAndRenderContacts();
        }
      });
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

  // Generate 100% Valid Standard ISO/IEC 18004 QR Code Matrix
  let qrCodeInstance = null;
  function renderPairingQR(code) {
    const container = document.getElementById('qr-canvas');
    if (!container) return;
    container.innerHTML = '';

    // Universal payload: handles KYNX in-app scanner, Google Lens, and system camera via app links
    const payload = `https://getkynx.vercel.app/web?pair=${code}`;

    try {
      if (typeof QRCode !== 'undefined') {
        qrCodeInstance = new QRCode(container, {
          text: payload,
          width: 240,
          height: 240,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H // Highest durability (30% error correction)
        });
      } else {
        // Dynamic fallback if offline or script deferred
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}&bgcolor=FFFFFF&color=000000&margin=4`;
        img.alt = 'KYNX QR Code';
        img.style.width = '240px';
        img.style.height = '240px';
        container.appendChild(img);
      }
    } catch (e) {
      console.warn('[KYNX Web] Error generating QR code:', e);
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}&bgcolor=FFFFFF&color=000000&margin=4`;
      img.alt = 'KYNX QR Code';
      img.style.width = '240px';
      img.style.height = '240px';
      container.appendChild(img);
    }
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
      el.loginError.style.color = 'var(--accent-purple-light)';
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
      el.otpError.style.color = 'var(--accent-purple-light)';
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
      el.otpError.style.color = 'var(--accent-purple-light)';
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

    // Initialize Audio & Notifications suite
    initAudioSuite();
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        updateNotifIcon(true);
      } else if (Notification.permission === 'default') {
        updateNotifIcon(false);
        // Prompt for notification permission on desk entrance
        requestNotificationPermission();
      } else {
        updateNotifIcon(false);
      }
    }

    // Connect WebSocket
    connectWebSocket();

    // Fetch Conversations
    loadConversations();

    // Periodic refresh of conversations
    if (conversationsPollTimer) clearInterval(conversationsPollTimer);
    conversationsPollTimer = setInterval(loadConversations, 8000);
  }

  // WebSocket Engine (25s Keepalive Ping + Deduplicated Auto-Reconnect)
  let wsPingTimer = null;
  let wsReconnectTimer = null;

  function stopWsHeartbeat() {
    if (wsPingTimer) {
      clearInterval(wsPingTimer);
      wsPingTimer = null;
    }
  }

  function scheduleWsReconnect(delayMs = 3000) {
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    wsReconnectTimer = setTimeout(() => {
      wsReconnectTimer = null;
      connectWebSocket();
    }, delayMs);
  }

  function connectWebSocket() {
    if (!AppState.token) return;
    if (AppState.ws && (AppState.ws.readyState === WebSocket.OPEN || AppState.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const wsUrl = `${WS_URL}?token=${encodeURIComponent(AppState.token)}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      AppState.ws = ws;

      ws.onopen = () => {
        if (AppState.ws !== ws) return;
        AppState.wsConnected = true;
        console.log('[KYNX WEB] WebSocket Relay Connected.');
        stopWsHeartbeat();
        wsPingTimer = setInterval(() => {
          if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
            try {
              AppState.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
            } catch (_) {}
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleWebSocketMessage(payload);
        } catch (e) {
          console.warn('[KYNX WEB] Non-JSON WS message:', event.data);
        }
      };

      ws.onclose = () => {
        if (AppState.ws !== ws) return;
        AppState.wsConnected = false;
        stopWsHeartbeat();
        console.log('[KYNX WEB] WebSocket closed. Reconnecting in 3s...');
        scheduleWsReconnect(3000);
      };

      ws.onerror = (err) => {
        console.warn('[KYNX WEB] WS error:', err);
      };
    } catch (err) {
      console.error('[KYNX WEB] Could not open WS:', err);
      scheduleWsReconnect(3000);
    }
  }

  window.addEventListener('online', () => {
    if (AppState.token && !AppState.wsConnected) {
      connectWebSocket();
    }
  });

  function handleWebSocketMessage(msg) {
    if (!msg || msg.type === 'pong' || msg.type === 'ping') return;
    if (msg.type === 'message' || msg.type === 'chat_message' || msg.message) {
      const message = msg.message || msg;
      receiveMessage(message);
    } else if (msg.type === 'typing') {
      const convId = msg.conversation_id || msg.conversationId;
      if (!AppState.activeConversation || (convId && String(convId) !== String(AppState.activeConversation.id))) {
        return;
      }
      const sender = msg.display_name || msg.username || msg.senderName;
      const isTyping = msg.is_typing !== undefined ? msg.is_typing : msg.isTyping;
      showPeerTyping(sender, isTyping);
    } else if (msg.type === 'call_offer') {
      handleIncomingCall(msg);
    } else if (msg.type === 'call_answer') {
      handleCallAnswer(msg);
    } else if (msg.type === 'call_ice_candidate') {
      handleRemoteIceCandidate(msg);
    } else if (msg.type === 'call_ringing') {
      handleCallRinging(msg);
    } else if (msg.type === 'call_reject') {
      handleCallReject(msg);
    } else if (msg.type === 'call_hangup') {
      handleCallHangup(msg);
    } else if (msg.type === 'call_answered_elsewhere') {
      if (CallManager.state === 'incoming') {
        stopIncomingRingtone();
        CallManager.reset();
        renderCallOverlay();
        showHeadsUpCard('Call Handled on Phone', msg.action === 'call_answer' ? 'Answered on another device' : 'Declined on another device');
      }
    } else if (msg.type === 'message_deleted') {
      applyMessageDeletedInUI(msg.id || msg.message_id);
      loadConversations();
    } else if (msg.type === 'message_edited') {
      applyMessageEditedInUI(msg.id || msg.message_id, msg.text || msg.content || '');
      loadConversations();
    } else if (msg.type === 'reaction_updated') {
      applyMessageReactionsInUI(msg.message_id || msg.id, msg.reactions || {});
    } else if (msg.type === 'conversation_deleted') {
      const deletedId = msg.conversation_id || msg.conversationId;
      if (deletedId && AppState.activeConversation && String(AppState.activeConversation.id) === String(deletedId)) {
        AppState.activeConversation = null;
        el.activeChatView.style.display = 'none';
        el.emptyState.style.display = 'flex';
        if (el.webApp) el.webApp.classList.remove('mobile-chat-open');
      }
      loadConversations();
    }
  }

  let handlingUnauthorized = false;
  function handleUnauthorized() {
    if (handlingUnauthorized) return;
    handlingUnauthorized = true;
    if (conversationsPollTimer) { clearInterval(conversationsPollTimer); conversationsPollTimer = null; }
    if (activeSyncTimer) { clearInterval(activeSyncTimer); activeSyncTimer = null; }
    stopWsHeartbeat();
    showHeadsUpCard('Session Expired', 'Please scan the QR code or sign in again.');
    setTimeout(() => {
      logout();
    }, 1200);
  }

  // Fetch Conversations from Cloud Backend
  async function loadConversations() {
    if (!AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        AppState.conversations = Array.isArray(data) ? data : (data.conversations || []);
        if (AppState.activeTab === 'chats') {
          renderConversations();
          if (AppState.searchQuery) {
            filterConversations(AppState.searchQuery);
          }
        }
        // Refresh active peer's online indicator if open
        if (AppState.activeConversation) {
          const updated = AppState.conversations.find(c => String(c.id) === String(AppState.activeConversation.id));
          if (updated && updated.peer) {
            AppState.activeConversation = updated;
            el.peerStatus.innerHTML = updated.peer.is_online ? `● online` : `<span style="color:var(--text-sub)">● offline</span>`;
          }
        }
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

      card.addEventListener('click', () => openConversation(conv, true));
      el.conversationsList.appendChild(card);
    });

    // Auto-select first conversation on desktop only (on mobile keep chat list visible)
    if (!AppState.activeConversation && AppState.conversations.length > 0 && window.innerWidth > 820) {
      openConversation(AppState.conversations[0], false);
    }
  }

  // Open Active Conversation
  async function openConversation(conv, openMobilePanel = true) {
    AppState.activeConversation = conv;
    clearReplyTarget();
    if (AppState.activeTab === 'chats') {
      renderConversations();
      if (AppState.searchQuery) filterConversations(AppState.searchQuery);
    }

    el.emptyState.style.display = 'none';
    el.activeChatView.style.display = 'flex';
    if (openMobilePanel && el.webApp) {
      el.webApp.classList.add('mobile-chat-open');
    }

    const peer = conv.peer || {};
    const title = peer.display_name || peer.username || conv.title || conv.displayName || 'Encrypted Peer';
    el.peerAvatar.textContent = title.substring(0, 2).toUpperCase();
    el.peerName.textContent = title;
    el.peerStatus.innerHTML = peer.is_online ? `● online` : `<span style="color:var(--text-sub)">● offline</span>`;

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
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const msgs = Array.isArray(data) ? data : (data.messages || []);
        if (!AppState.messages[convId]) AppState.messages[convId] = [];
        
        let shouldScroll = false;
        msgs.forEach(m => {
          const exists = AppState.messages[convId].some(existing => existing.id === m.id || (existing.client_msg_id && existing.client_msg_id === m.id));
          if (!exists) {
            AppState.messages[convId].push(m);
            const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
            const sender = m.sender_id || m.senderId;
            const isMine = (myId && sender === myId) || m.isMine;
            if (!isMine && (document.hidden || !document.hasFocus())) {
              triggerMessageNotification(m);
            }
          } else {
            // Sync live edits, deletions, and reactions on existing bubbles
            if (m.is_deleted || m.isDeleted) {
              applyMessageDeletedInUI(m.id);
            } else if (m.is_edited || m.isEdited) {
              applyMessageEditedInUI(m.id, m.text || m.content || '');
            }
            if (m.reactions) {
              applyMessageReactionsInUI(m.id, m.reactions);
            }
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
    const replySnapshot = AppState.replyTo ? { ...AppState.replyTo } : null;
    clearReplyTarget();

    const tempId = 'kynx_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : 'me';
    const newMsg = {
      id: tempId,
      client_msg_id: tempId,
      conversation_id: AppState.activeConversation.id,
      text: text,
      sender_id: myId,
      created_at: new Date().toISOString(),
      reply_to_id: replySnapshot ? replySnapshot.id : null,
      reply_to_text: replySnapshot ? replySnapshot.text : null,
      reply_to_sender: replySnapshot ? replySnapshot.sender : null,
      isMine: true
    };

    if (!AppState.messages[AppState.activeConversation.id]) {
      AppState.messages[AppState.activeConversation.id] = [];
    }
    AppState.messages[AppState.activeConversation.id].push(newMsg);
    appendMessageToUI(newMsg);
    scrollChatToBottom();

    const payload = {
      conversation_id: AppState.activeConversation.id,
      text: text,
      client_msg_id: tempId
    };
    if (replySnapshot) {
      payload.reply_to_id = replySnapshot.id;
      payload.reply_to_text = replySnapshot.text;
      payload.reply_to_sender = replySnapshot.sender;
    }

    const convId = AppState.activeConversation.id;
    await postMessagePayload(convId, payload, newMsg, tempId);
  }

  async function postMessagePayload(convId, payload, msgObj, tempId) {
    const bubble = el.messagesCanvas.querySelector(`[data-client-msg-id="${tempId}"], [data-msg-id="${tempId}"]`);
    const tickEl = bubble ? bubble.querySelector('.msg-ticks') : null;
    if (tickEl) {
      tickEl.textContent = '⏳';
      tickEl.style.color = '';
      tickEl.style.cursor = 'default';
      tickEl.onclick = null;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          msgObj.id = saved.id;
          if (bubble) bubble.setAttribute('data-msg-id', saved.id);
        }
        if (tickEl) {
          tickEl.textContent = '✓';
          tickEl.style.opacity = '0.75';
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
      if (tickEl) {
        tickEl.textContent = '⚠️ Failed · Retry';
        tickEl.style.color = '#ff526b';
        tickEl.style.opacity = '1';
        tickEl.style.cursor = 'pointer';
        tickEl.title = 'Click to retry sending';
        tickEl.onclick = (ev) => {
          ev.stopPropagation();
          postMessagePayload(convId, payload, msgObj, tempId);
        };
      }
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

    // Trigger phone-style notification if incoming message
    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
    const sender = msg.sender_id || msg.senderId;
    const isMine = (myId && sender === myId) || msg.isMine;
    if (!isMine) {
      triggerMessageNotification(msg);
    }
  }

  function resolveMediaUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    // Strictly allow only safe HTTP(S) URLs or relative server paths (blocks javascript:/data: XSS)
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return `${BACKEND_URL}${trimmed}`;
    }
    if (/^[a-z0-9_\-\/\.]+$/i.test(trimmed)) {
      return `${BACKEND_URL}/${trimmed}`;
    }
    return '';
  }

  function formatReactionsHtml(reactionsObj) {
    if (!reactionsObj || typeof reactionsObj !== 'object') return '';
    let pills = '';
    if (Array.isArray(reactionsObj)) {
      const counts = {};
      reactionsObj.forEach(r => {
        const em = typeof r === 'string' ? r : (r.reaction || r.emoji);
        if (em) counts[em] = (counts[em] || 0) + 1;
      });
      Object.entries(counts).forEach(([em, cnt]) => {
        pills += `<span class="msg-reaction-pill" data-react="${escapeHtml(em)}">${escapeHtml(em)}${cnt > 1 ? ` ${cnt}` : ''}</span>`;
      });
    } else {
      Object.entries(reactionsObj).forEach(([em, users]) => {
        const cnt = Array.isArray(users) ? users.length : (typeof users === 'number' ? users : 1);
        if (cnt > 0) {
          pills += `<span class="msg-reaction-pill" data-react="${escapeHtml(em)}">${escapeHtml(em)}${cnt > 1 ? ` ${cnt}` : ''}</span>`;
        }
      });
    }
    return pills;
  }

  function setReplyTarget(msgId, senderName, previewText) {
    AppState.replyTo = { id: msgId, sender: senderName, text: (previewText || '').slice(0, 120) };
    if (el.replyPreviewBar) {
      el.replyPreviewBar.style.display = 'flex';
      if (el.replyPreviewSender) el.replyPreviewSender.textContent = `Replying to ${senderName}`;
      if (el.replyPreviewText) el.replyPreviewText.textContent = AppState.replyTo.text;
    }
    if (el.msgInput) el.msgInput.focus();
  }

  function clearReplyTarget() {
    AppState.replyTo = null;
    if (el.replyPreviewBar) el.replyPreviewBar.style.display = 'none';
  }

  async function toggleMessageReaction(msgId, emoji) {
    if (!msgId || !AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${msgId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify({ reaction: emoji })
      });
      if (res.ok) {
        const data = await res.json();
        applyMessageReactionsInUI(msgId, data.reactions || {});
      }
    } catch (e) {
      console.warn('[KYNX WEB] Reaction error:', e);
    }
  }

  async function deleteMessageFromWeb(msgId, isMine) {
    if (!msgId || !AppState.token) return;
    const promptMsg = isMine ? 'Delete this message for everyone?' : 'Hide this message for you?';
    if (!confirm(promptMsg)) return;
    try {
      if (isMine) {
        const res = await fetch(`${BACKEND_URL}/api/messages/${msgId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        });
        if (res.ok) applyMessageDeletedInUI(msgId);
      } else {
        const res = await fetch(`${BACKEND_URL}/api/messages/${msgId}/hide`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        });
        if (res.ok) {
          const elBubble = el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`);
          if (elBubble) elBubble.remove();
        }
      }
    } catch (e) {
      console.warn('[KYNX WEB] Delete error:', e);
    }
  }

  function applyMessageDeletedInUI(msgId) {
    if (!msgId) return;
    const wrapper = el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`);
    if (!wrapper) return;
    const body = wrapper.querySelector('.msg-body-slot');
    if (body) body.innerHTML = `<div class="msg-deleted-text">🚫 This message was deleted</div>`;
    const actions = wrapper.querySelector('.msg-hover-actions');
    if (actions) actions.remove();
  }

  function applyMessageEditedInUI(msgId, newText) {
    if (!msgId) return;
    const wrapper = el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`);
    if (!wrapper) return;
    const textBody = wrapper.querySelector('.msg-text-body');
    if (textBody) textBody.textContent = newText;
    const meta = wrapper.querySelector('.msg-meta-row');
    if (meta && !meta.querySelector('.msg-edited-tag')) {
      const tag = document.createElement('span');
      tag.className = 'msg-edited-tag';
      tag.textContent = '(edited)';
      meta.prepend(tag);
    }
  }

  function applyMessageReactionsInUI(msgId, reactionsObj) {
    if (!msgId) return;
    const wrapper = el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`);
    if (!wrapper) return;
    const row = wrapper.querySelector('.msg-reactions-row');
    if (!row) return;
    const html = formatReactionsHtml(reactionsObj);
    row.innerHTML = html;
    row.style.display = html ? 'flex' : 'none';
  }

  // Voice Note Recorder (MediaRecorder API -> /api/media/upload)
  let voiceRecorder = null;
  let voiceChunks = [];
  let voiceStream = null;
  let isRecordingVoice = false;

  function cancelActiveVoiceRecording() {
    if (!isRecordingVoice && !voiceRecorder && !voiceStream) return;
    isRecordingVoice = false;
    voiceChunks = [];
    if (voiceRecorder) {
      try {
        voiceRecorder.onstop = null;
        if (voiceRecorder.state !== 'inactive') voiceRecorder.stop();
      } catch (_) {}
      voiceRecorder = null;
    }
    if (voiceStream) {
      voiceStream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
      voiceStream = null;
    }
    if (el.btnRecordVoice) {
      el.btnRecordVoice.classList.remove('recording');
      el.btnRecordVoice.title = 'Record Voice Note';
    }
  }

  async function toggleVoiceRecording() {
    if (!AppState.activeConversation || !AppState.token) {
      showHeadsUpCard('Select a Chat', 'Open a conversation before recording a voice note.');
      return;
    }
    if (isRecordingVoice && voiceRecorder) {
      try { voiceRecorder.stop(); } catch (_) {}
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support voice recording.');
      return;
    }
    try {
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '');
      voiceRecorder = mimeType ? new MediaRecorder(voiceStream, { mimeType }) : new MediaRecorder(voiceStream);
      voiceChunks = [];
      isRecordingVoice = true;
      if (el.btnRecordVoice) {
        el.btnRecordVoice.classList.add('recording');
        el.btnRecordVoice.title = 'Click to Stop & Send Voice Note';
      }
      showHeadsUpCard('Recording Voice Note 🎙️', 'Tap the red microphone icon again to send.');

      voiceRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) voiceChunks.push(ev.data);
      };

      voiceRecorder.onstop = async () => {
        isRecordingVoice = false;
        if (el.btnRecordVoice) {
          el.btnRecordVoice.classList.remove('recording');
          el.btnRecordVoice.title = 'Record Voice Note';
        }
        if (voiceStream) {
          voiceStream.getTracks().forEach(t => t.stop());
          voiceStream = null;
        }
        if (voiceChunks.length === 0) return;

        const blob = new Blob(voiceChunks, { type: voiceRecorder.mimeType || 'audio/webm' });
        const ext = (blob.type || '').includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' });
        voiceChunks = [];

        try {
          showHeadsUpCard('Sending Voice Note', 'Uploading audio...');
          const formData = new FormData();
          formData.append('file', file);
          const upRes = await fetch(`${BACKEND_URL}/api/media/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AppState.token}` },
            body: formData
          });
          if (!upRes.ok) throw new Error('Audio upload failed');
          const uploaded = await upRes.json();
          const convId = AppState.activeConversation.id;
          const tempId = 'kynx_voice_' + Date.now();
          const msgRes = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${AppState.token}`
            },
            body: JSON.stringify({
              conversation_id: convId,
              text: '[Voice Note]',
              client_msg_id: tempId,
              media_url: uploaded.url,
              media_type: 'audio'
            })
          });
          if (msgRes.ok) {
            const saved = await msgRes.json();
            if (!AppState.messages[convId]) AppState.messages[convId] = [];
            AppState.messages[convId].push(saved);
            appendMessageToUI(saved);
            scrollChatToBottom();
            loadConversations();
          }
        } catch (err) {
          console.error('[KYNX WEB] Voice note error:', err);
          showHeadsUpCard('Voice Note Failed', err.message || 'Could not send voice note.');
        }
      };

      voiceRecorder.start();
    } catch (err) {
      isRecordingVoice = false;
      console.error('[KYNX WEB] Microphone access error:', err);
      alert('Microphone permission is required to record voice notes.');
    }
  }

  // Append Message Card to Canvas
  function appendMessageToUI(msg) {
    if (!msg) return false;
    const msgId = msg.id || msg.client_msg_id;
    const clientMsgId = msg.client_msg_id || msg.clientMsgId || null;

    if (msgId && el.messagesCanvas.querySelector(`[data-msg-id="${msgId}"]`)) {
      return false; // Already in DOM
    }
    // Race condition guard: if optimistic bubble exists via client_msg_id, upgrade its data-msg-id in place (zero duplicates!)
    if (clientMsgId) {
      const existingOptimistic = el.messagesCanvas.querySelector(`[data-client-msg-id="${clientMsgId}"], [data-msg-id="${clientMsgId}"]`);
      if (existingOptimistic) {
        if (msg.id) existingOptimistic.setAttribute('data-msg-id', msg.id);
        return false;
      }
    }

    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
    const sender = msg.sender_id || msg.senderId;
    const isMine = (myId && sender === myId) || msg.isMine;
    const isGroupChat = Boolean(AppState.activeConversation && (AppState.activeConversation.is_group || AppState.activeConversation.isGroup));
    const peerName = (AppState.activeConversation && AppState.activeConversation.peer && (AppState.activeConversation.peer.display_name || AppState.activeConversation.peer.username)) || 'Peer';
    const senderLabel = isMine ? 'You' : (msg.sender_name || msg.senderName || peerName);

    const wrapper = document.createElement('div');
    wrapper.className = `msg-bubble-wrapper ${isMine ? 'mine' : 'peer'}`;
    if (msgId) wrapper.setAttribute('data-msg-id', msgId);
    if (clientMsgId) wrapper.setAttribute('data-client-msg-id', clientMsgId);

    const groupSenderHtml = (isGroupChat && !isMine)
      ? `<div style="font-size:11px;font-weight:700;color:var(--accent-purple-light);margin-bottom:4px;">${escapeHtml(senderLabel)}</div>`
      : '';

    const time = formatTime(msg.created_at || msg.createdAt || Date.now());
    const rawText = msg.text || msg.content || '';
    const isDeleted = Boolean(msg.is_deleted || msg.isDeleted);
    const isEdited = Boolean(msg.is_edited || msg.isEdited);
    const mediaUrl = resolveMediaUrl(msg.media_url || msg.mediaUrl);
    const mediaType = (msg.media_type || msg.mediaType || '').toLowerCase();
    const isViewOnce = Boolean(msg.is_view_once || msg.isViewOnce);
    const viewOnceOpened = Boolean(msg.view_once_opened || msg.viewOnceOpened);

    const replyToText = msg.reply_to_text || msg.replyToText;
    const replyToSender = msg.reply_to_sender || msg.replyToSender || 'Message';
    const quotedHtml = replyToText
      ? `<div class="msg-quoted-reply"><div class="msg-quoted-sender">${escapeHtml(replyToSender)}</div><div class="msg-quoted-text">${escapeHtml(replyToText)}</div></div>`
      : '';

    let bodyHtml = '';
    if (isDeleted) {
      bodyHtml = `<div class="msg-deleted-text">🚫 This message was deleted</div>`;
    } else {
      let mediaHtml = '';
      if (isViewOnce) {
        mediaHtml = `
          <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(167,139,250,0.14);border:1px solid rgba(167,139,250,0.35);margin-bottom:6px;font-size:13px;">
            <span>${viewOnceOpened ? '👁️‍🗨️ View-Once Opened' : '🔒 View-Once Media (Open on KYNX Phone App)'}</span>
          </div>`;
      } else if (mediaUrl) {
        const safeUrl = escapeHtml(mediaUrl);
        if (mediaType.includes('image') || /\.(png|jpe?g|gif|webp)$/i.test(mediaUrl)) {
          mediaHtml = `
            <a href="${safeUrl}" target="_blank" rel="noopener" style="display:block;margin-bottom:6px;">
              <img src="${safeUrl}" alt="Photo" loading="lazy" style="max-width:260px;max-height:280px;border-radius:12px;display:block;object-fit:cover;border:1px solid rgba(255,255,255,0.12);" />
            </a>`;
        } else if (mediaType.includes('video') || /\.(mp4|webm|mov)$/i.test(mediaUrl)) {
          mediaHtml = `
            <video controls playsinline preload="metadata" src="${safeUrl}" style="max-width:280px;max-height:240px;border-radius:12px;display:block;margin-bottom:6px;background:#000;"></video>`;
        } else if (mediaType.includes('audio') || /\.(m4a|mp3|ogg|wav|aac|opus)$/i.test(mediaUrl)) {
          mediaHtml = `
            <div style="margin-bottom:6px;">
              <audio controls preload="metadata" src="${safeUrl}" style="max-width:250px;height:36px;"></audio>
            </div>`;
        } else {
          mediaHtml = `
            <a href="${safeUrl}" target="_blank" rel="noopener" download style="display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,0.08);color:inherit;text-decoration:none;margin-bottom:6px;font-size:13px;">
              <span>📎</span>
              <span>${escapeHtml(rawText || 'Download Attachment')}</span>
            </a>`;
        }
      }

      const isPlaceholderCaption = mediaUrl && /^\[(photo|image|video|audio|voice|voice note|file|attachment)\]/i.test(rawText.trim());
      const textHtml = (!mediaUrl || (!isPlaceholderCaption && !mediaHtml.includes('📎')))
        ? `<div class="msg-text-body">${escapeHtml(rawText)}</div>`
        : '';

      bodyHtml = `${quotedHtml}${mediaHtml}${textHtml}`;
    }

    const delivery = (msg.delivery_status || msg.deliveryStatus || 'sent').toLowerCase();
    const tickHtml = isMine
      ? (delivery === 'read'
          ? `<span class="msg-ticks" style="color:#38bdf8">✓✓</span>`
          : delivery === 'delivered'
            ? `<span class="msg-ticks">✓✓</span>`
            : `<span class="msg-ticks" style="opacity:0.65">✓</span>`)
      : '';

    const reactionsHtml = formatReactionsHtml(msg.reactions);
    const canEdit = isMine && !mediaUrl && !isViewOnce;
    const hoverBarHtml = (!isDeleted && msgId)
      ? `<div class="msg-hover-actions">
          <button type="button" class="msg-act-btn" data-act="reply" title="Reply">↩️</button>
          <button type="button" class="msg-act-btn" data-act="react" data-emoji="❤️" title="React ❤️">❤️</button>
          <button type="button" class="msg-act-btn" data-act="react" data-emoji="👍" title="React 👍">👍</button>
          <button type="button" class="msg-act-btn" data-act="react" data-emoji="😂" title="React 😂">😂</button>
          ${canEdit ? '<button type="button" class="msg-act-btn" data-act="edit" title="Edit Message">✏️</button>' : ''}
          <button type="button" class="msg-act-btn" data-act="delete" title="${isMine ? 'Delete for Everyone' : 'Hide for Me'}">🗑️</button>
        </div>`
      : '';

    wrapper.innerHTML = `
      ${hoverBarHtml}
      <div class="msg-bubble-content">
        ${groupSenderHtml}
        <div class="msg-body-slot">${bodyHtml}</div>
        <div class="msg-reactions-row" style="display:${reactionsHtml ? 'flex' : 'none'}">${reactionsHtml}</div>
        <div class="msg-meta-row">
          ${isEdited ? '<span class="msg-edited-tag">(edited)</span>' : ''}
          <span>${time}</span>
          ${tickHtml}
        </div>
      </div>
    `;

    // Wire hover actions & clickable reaction pills
    wrapper.querySelectorAll('.msg-act-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const currentId = wrapper.getAttribute('data-msg-id');
        const act = btn.getAttribute('data-act');
        if (act === 'reply') {
          setReplyTarget(currentId, senderLabel, rawText || '[Media]');
        } else if (act === 'react') {
          toggleMessageReaction(currentId, btn.getAttribute('data-emoji'));
        } else if (act === 'edit') {
          const currentTxt = wrapper.querySelector('.msg-text-body')?.textContent || rawText;
          editMessageFromWeb(currentId, currentTxt);
        } else if (act === 'delete') {
          deleteMessageFromWeb(currentId, isMine);
        }
      });
    });

    const reactionsRow = wrapper.querySelector('.msg-reactions-row');
    if (reactionsRow) {
      reactionsRow.addEventListener('click', (ev) => {
        const pill = ev.target.closest('.msg-reaction-pill');
        if (!pill) return;
        ev.stopPropagation();
        const currentId = wrapper.getAttribute('data-msg-id');
        const emoji = pill.getAttribute('data-react');
        if (currentId && emoji) toggleMessageReaction(currentId, emoji);
      });
    }

    el.messagesCanvas.appendChild(wrapper);
    return true;
  }

  async function editMessageFromWeb(msgId, currentText) {
    if (!msgId || !AppState.token) return;
    const edited = prompt('Edit your message:', currentText || '');
    if (edited === null) return;
    const trimmed = edited.trim();
    if (!trimmed || trimmed === (currentText || '').trim()) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/${msgId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify({ text: trimmed })
      });
      if (res.status === 401) { handleUnauthorized(); return; }
      if (res.ok) {
        applyMessageEditedInUI(msgId, trimmed);
        loadConversations();
      } else {
        showHeadsUpCard('Edit Failed', 'Could not update message.');
      }
    } catch (err) {
      console.warn('[KYNX WEB] Edit error:', err);
    }
  }

  const QUICK_EMOJIS = [
    '😀','😂','🥹','😍','🥰','😎','🤩','🥳',
    '😭','😡','🤯','🤔','🫡','😴','🫠','🤫',
    '🔥','❤️','💜','💯','⚡','✨','🎉','🚀',
    '👍','👎','👏','🙏','🤝','✌️','💪','👀',
    '💀','🤡','👑','💎','🎧','📱','💻','☕'
  ];

  function toggleEmojiPicker() {
    if (!el.emojiPickerPopover) return;
    if (el.emojiPickerPopover.childElementCount === 0) {
      QUICK_EMOJIS.forEach(em => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-grid-btn';
        b.textContent = em;
        b.addEventListener('click', (ev) => {
          ev.stopPropagation();
          insertEmojiAtCursor(em);
        });
        el.emojiPickerPopover.appendChild(b);
      });
    }
    const isVisible = el.emojiPickerPopover.style.display === 'grid';
    el.emojiPickerPopover.style.display = isVisible ? 'none' : 'grid';
  }

  function insertEmojiAtCursor(emoji) {
    if (!el.msgInput) return;
    const start = el.msgInput.selectionStart || el.msgInput.value.length;
    const end = el.msgInput.selectionEnd || el.msgInput.value.length;
    const val = el.msgInput.value;
    el.msgInput.value = val.slice(0, start) + emoji + val.slice(end);
    el.msgInput.focus();
    const nextPos = start + emoji.length;
    el.msgInput.setSelectionRange(nextPos, nextPos);
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

  // 2. Real Media / File Upload (Picker + Ctrl+V Paste + Drag & Drop, up to 50MB)
  function handleFileUpload(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) uploadAndSendFile(file);
  }

  async function uploadAndSendFile(file) {
    if (!file) return;
    if (!AppState.activeConversation || !AppState.token) {
      showHeadsUpCard('Select a Chat', 'Please open a conversation before attaching a file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds the 50 MB KYNX upload limit.');
      return;
    }

    const displayName = file.name || `screenshot_${Date.now()}.png`;
    showHeadsUpCard('Uploading Media', `Sending "${displayName}" (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${BACKEND_URL}/api/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AppState.token}` },
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Upload failed (${uploadRes.status})`);
      }

      const uploaded = await uploadRes.json();
      const mime = (file.type || uploaded.content_type || 'application/octet-stream').toLowerCase();
      let kind = 'document';
      let caption = file.name;
      if (mime.startsWith('image/')) { kind = 'image'; caption = '[Photo]'; }
      else if (mime.startsWith('video/')) { kind = 'video'; caption = '[Video]'; }
      else if (mime.startsWith('audio/')) { kind = 'audio'; caption = '[Audio]'; }

      const tempId = 'kynx_media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const convId = AppState.activeConversation.id;

      const msgRes = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AppState.token}`
        },
        body: JSON.stringify({
          conversation_id: convId,
          text: caption,
          client_msg_id: tempId,
          media_url: uploaded.url,
          media_type: kind
        })
      });

      if (msgRes.ok) {
        const saved = await msgRes.json();
        if (!AppState.messages[convId]) AppState.messages[convId] = [];
        AppState.messages[convId].push(saved);
        appendMessageToUI(saved);
        scrollChatToBottom();
        loadConversations();
      } else {
        throw new Error(`Failed to send media message (${msgRes.status})`);
      }
    } catch (err) {
      console.error('[KYNX WEB] File upload error:', err);
      showHeadsUpCard('Upload Failed', err.message || 'Could not upload file.');
    }
  }

  // 4. Typing Indicator (Matches server.py typing_start / typing_stop protocol)
  let typingTimeout = null;
  function broadcastTyping() {
    if (!AppState.ws || AppState.ws.readyState !== WebSocket.OPEN || !AppState.activeConversation) return;
    const convId = AppState.activeConversation.id;
    AppState.ws.send(JSON.stringify({
      type: 'typing_start',
      conversation_id: convId
    }));

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
        AppState.ws.send(JSON.stringify({
          type: 'typing_stop',
          conversation_id: convId
        }));
      }
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

  // ==========================================================================
  // WEBRTC HIGH-DEFINITION CALLING ENGINE (Audio & Video Deck)
  // Seamless compatibility with Android WebRtcCallManager & Render relay
  // ==========================================================================

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:openrelay.metered.ca:80' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ]
  };

  const CallManager = {
    state: 'idle', // 'idle' | 'dialing' | 'ringing' | 'incoming' | 'connecting' | 'connected'
    callId: null,
    serverLogId: null,
    peerId: null,
    peerName: 'Encrypted Peer',
    callType: 'voice', // 'voice' | 'video'
    isOutgoing: false,
    pc: null,
    localStream: null,
    remoteStream: null,
    pendingOfferSdp: null,
    pendingCandidates: [],
    connectedAt: 0,
    durationTimer: null,
    timeoutTimer: null,
    isMuted: false,
    isVideoDisabled: false,
    isMinimized: false,

    reset() {
      this.state = 'idle';
      this.callId = null;
      this.serverLogId = null;
      this.peerId = null;
      this.peerName = 'Encrypted Peer';
      this.callType = 'voice';
      this.isOutgoing = false;
      this.pc = null;
      this.localStream = null;
      this.remoteStream = null;
      this.pendingOfferSdp = null;
      this.pendingCandidates = [];
      this.connectedAt = 0;
      if (this.durationTimer) { clearInterval(this.durationTimer); this.durationTimer = null; }
      if (this.timeoutTimer) { clearTimeout(this.timeoutTimer); this.timeoutTimer = null; }
      this.isMuted = false;
      this.isVideoDisabled = false;
      this.isMinimized = false;
    }
  };

  function sendWsFrame(payload) {
    if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
      AppState.ws.send(JSON.stringify(payload));
      return true;
    }
    console.warn('[KYNX WebRTC] Cannot send frame, WebSocket closed:', payload.type);
    return false;
  }

  function getPeerId(conv) {
    if (!conv) return null;
    if (conv.peer && conv.peer.id) return conv.peer.id;
    if (conv.peer_id) return conv.peer_id;
    if (conv.target_id) return conv.target_id;
    if (Array.isArray(conv.participants)) {
      const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
      const other = conv.participants.find(p => p.id !== myId);
      if (other) return other.id;
    }
    return null;
  }

  function getPeerDisplayName(conv) {
    if (!conv) return 'Encrypted Peer';
    const peer = conv.peer || {};
    return peer.display_name || peer.username || conv.title || conv.displayName || 'Encrypted Peer';
  }

  // Audio Tones (SUP Ringback tone generator via Web Audio API)
  let ringbackAudioCtx = null;
  let ringbackTimer = null;

  function playRingback() {
    stopRingback();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ringbackAudioCtx = new AudioCtx();

      function ringCycle() {
        if (!ringbackAudioCtx || ringbackAudioCtx.state === 'closed') return;
        const osc1 = ringbackAudioCtx.createOscillator();
        const osc2 = ringbackAudioCtx.createOscillator();
        const gain = ringbackAudioCtx.createGain();

        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        gain.gain.value = 0.08;

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ringbackAudioCtx.destination);

        osc1.start();
        osc2.start();

        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
            osc1.disconnect();
            osc2.disconnect();
          } catch (_) {}
        }, 1600);

        ringbackTimer = setTimeout(ringCycle, 4000);
      }

      ringCycle();
    } catch (e) {
      console.warn('[KYNX WebRTC] Ringback tone error:', e);
    }
  }

  function stopRingback() {
    if (ringbackTimer) {
      clearTimeout(ringbackTimer);
      ringbackTimer = null;
    }
    if (ringbackAudioCtx) {
      try {
        ringbackAudioCtx.close();
      } catch (_) {}
      ringbackAudioCtx = null;
    }
  }

  function playIncomingRingtone() {
    try {
      const audio = el.ringtoneAudio || document.getElementById('kynx-ringtone-audio');
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 1.0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(e => console.warn('[KYNX WebRTC] Browser blocked ringtone autoplay:', e));
        }
      }
    } catch (e) {
      console.warn('[KYNX WebRTC] Incoming ringtone error:', e);
    }
  }

  function stopIncomingRingtone() {
    try {
      const audio = el.ringtoneAudio || document.getElementById('kynx-ringtone-audio');
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (_) {}
  }

  function renderCallOverlay() {
    if (!el.callOverlay) return;

    if (CallManager.state === 'idle') {
      el.callOverlay.style.display = 'none';
      if (el.callMinimizedBar) el.callMinimizedBar.style.display = 'none';
      return;
    }

    if (CallManager.isMinimized) {
      el.callOverlay.style.display = 'none';
      if (el.callMinimizedBar) {
        el.callMinimizedBar.style.display = 'flex';
        if (el.callMinName) el.callMinName.textContent = CallManager.peerName;
      }
      return;
    }

    if (el.callMinimizedBar) el.callMinimizedBar.style.display = 'none';
    el.callOverlay.style.display = 'flex';

    const isVideo = (CallManager.callType === 'video');

    // Update Badge
    if (el.callTypeText) {
      el.callTypeText.textContent = isVideo ? 'WebRTC HD Video Call' : 'WebRTC HD Voice Call';
    }

    // Toggle Stages (Video stage vs Audio card)
    if (isVideo && (CallManager.state === 'connected' || CallManager.state === 'dialing' || CallManager.state === 'connecting')) {
      if (el.callVideoStage) el.callVideoStage.style.display = 'block';
      if (el.callAudioCard) el.callAudioCard.style.display = 'none';
      if (el.videoPeerName) el.videoPeerName.textContent = CallManager.peerName;
    } else {
      if (el.callVideoStage) el.callVideoStage.style.display = 'none';
      if (el.callAudioCard) el.callAudioCard.style.display = 'block';
    }

    // Update caller name and initials
    if (el.callerName) el.callerName.textContent = CallManager.peerName;
    if (el.callAvatarInitials) {
      el.callAvatarInitials.textContent = CallManager.peerName.substring(0, 2).toUpperCase() || '📞';
    }

    // Update Status text
    if (el.callStatus) {
      if (CallManager.state === 'dialing') {
        el.callStatus.textContent = 'Calling peer...';
      } else if (CallManager.state === 'ringing') {
        el.callStatus.textContent = 'Ringing...';
      } else if (CallManager.state === 'incoming') {
        el.callStatus.textContent = `Incoming ${isVideo ? 'Video' : 'Voice'} Call`;
      } else if (CallManager.state === 'connecting') {
        el.callStatus.textContent = 'Establishing peer connection...';
      } else if (CallManager.state === 'connected') {
        el.callStatus.textContent = 'Connected (Encrypted Direct Link)';
      }
    }

    // Toggle incoming vs active buttons
    if (CallManager.state === 'incoming') {
      if (el.callIncomingActions) el.callIncomingActions.style.display = 'flex';
      if (el.callActiveActions) el.callActiveActions.style.display = 'none';
    } else {
      if (el.callIncomingActions) el.callIncomingActions.style.display = 'none';
      if (el.callActiveActions) el.callActiveActions.style.display = 'flex';
    }

    // Show/hide Camera button based on call type
    if (el.btnCallToggleCam) {
      el.btnCallToggleCam.style.display = isVideo ? 'flex' : 'none';
    }

    // Show timer when connected
    if (el.callTimer) {
      el.callTimer.style.display = (CallManager.state === 'connected') ? 'block' : 'none';
    }
  }

  function attachRemoteTrack(event) {
    let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
    if (!stream && event.track) {
      if (!CallManager.remoteStream) {
        CallManager.remoteStream = new MediaStream();
      }
      if (!CallManager.remoteStream.getTracks().includes(event.track)) {
        CallManager.remoteStream.addTrack(event.track);
      }
      stream = CallManager.remoteStream;
    } else if (stream) {
      CallManager.remoteStream = stream;
    }
    if (!stream) return;
    if (el.remoteVideo) {
      el.remoteVideo.srcObject = stream;
      el.remoteVideo.play().catch(e => console.warn('remoteVideo play err:', e));
    }
    if (el.remoteAudio) {
      el.remoteAudio.srcObject = stream;
      el.remoteAudio.play().catch(e => console.warn('remoteAudio play err:', e));
    }
  }

  // Initiate Outgoing Call
  async function initiateCall(type = 'voice') {
    if (!AppState.activeConversation) {
      alert('Please select a conversation to start a call.');
      return;
    }
    if (AppState.activeConversation.is_group || AppState.activeConversation.isGroup) {
      showHeadsUpCard('1-on-1 Calls Only', 'Group voice/video calls are coming soon! Select a direct chat to call.');
      return;
    }
    if (!AppState.ws || !AppState.wsConnected) {
      alert('You are offline. Please wait for reconnection before placing a call.');
      return;
    }
    if (CallManager.state !== 'idle') {
      alert('You are already in an active call.');
      return;
    }

    cancelActiveVoiceRecording();

    const peerId = getPeerId(AppState.activeConversation);
    if (!peerId) {
      alert('Could not determine peer identity for this conversation.');
      return;
    }

    const peerName = getPeerDisplayName(AppState.activeConversation);
    const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const isVideo = (type === 'video');

    CallManager.reset();
    CallManager.state = 'dialing';
    CallManager.callId = callId;
    CallManager.peerId = peerId;
    CallManager.peerName = peerName;
    CallManager.callType = type;
    CallManager.isOutgoing = true;

    renderCallOverlay();

    try {
      const constraints = {
        audio: true,
        video: isVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false
      };

      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (isVideo) {
          console.warn('[KYNX WebRTC] Camera capture failed, falling back to audio-only:', err);
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          CallManager.callType = 'voice';
        } else {
          throw err;
        }
      }

      CallManager.localStream = localStream;
      if (el.localVideo && isVideo) {
        el.localVideo.srcObject = localStream;
        el.localVideo.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      CallManager.pc = pc;

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        console.log('[KYNX WebRTC] ontrack received on caller:', event.streams, event.track?.kind);
        attachRemoteTrack(event);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWsFrame({
            type: 'call_ice_candidate',
            target_id: peerId,
            callee_id: peerId,
            call_type: CallManager.callType,
            call_id: callId,
            candidate: event.candidate.candidate,
            sdp_mid: event.candidate.sdpMid,
            sdp_mline_index: event.candidate.sdpMLineIndex
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[KYNX WebRTC] Caller connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          onCallConnected();
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          endCall('Connection lost');
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendWsFrame({
        type: 'call_offer',
        target_id: peerId,
        callee_id: peerId,
        call_type: CallManager.callType,
        call_id: callId,
        sdp: offer.sdp
      });

      playRingback();

      // Arm 45-second dialing timeout
      CallManager.timeoutTimer = setTimeout(() => {
        if (CallManager.state === 'dialing' || CallManager.state === 'ringing') {
          endCall('No answer');
        }
      }, 45000);

      // Log call initiation on server
      if (AppState.token) {
        fetch(`${BACKEND_URL}/api/calls`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AppState.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            callee_id: peerId,
            call_type: CallManager.callType,
            status: 'initiated'
          })
        }).then(r => r.json()).then(data => {
          if (data && data.id) CallManager.serverLogId = data.id;
        }).catch(() => {});
      }

    } catch (err) {
      console.error('[KYNX WebRTC] Failed to initiate call:', err);
      alert('Could not access microphone/camera. Please grant browser permissions.');
      endCall('Call failed to start');
    }
  }

  // Handle Incoming Call from Peer (Phone or Web)
  function handleIncomingCall(msg) {
    console.log('[KYNX WebRTC] Incoming call signal:', msg);
    const fromUserId = msg.from_user_id || msg.fromUserId;
    const fromName = msg.from_display_name || msg.fromDisplayName || msg.from_username || 'Encrypted Peer';
    const callType = msg.call_type || msg.callType || 'voice';
    const callId = msg.call_id || msg.callId || ('call_' + Date.now());
    const sdp = msg.sdp;

    if (CallManager.state !== 'idle') {
      sendWsFrame({
        type: 'call_reject',
        target_id: fromUserId,
        callee_id: fromUserId,
        call_type: callType,
        call_id: callId,
        reason: 'busy'
      });
      return;
    }

    CallManager.reset();
    CallManager.state = 'incoming';
    CallManager.callId = callId;
    CallManager.peerId = fromUserId;
    CallManager.peerName = fromName;
    CallManager.callType = callType;
    CallManager.pendingOfferSdp = sdp;
    CallManager.isOutgoing = false;

    // Send call_ringing back to caller so their phone/client knows our deck is ringing
    sendWsFrame({
      type: 'call_ringing',
      target_id: fromUserId,
      callee_id: fromUserId,
      call_type: callType,
      call_id: callId
    });

    playIncomingRingtone();
    renderCallOverlay();

    showHeadsUpCard(`Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`, `${fromName} is calling you on KYNX!`);
    triggerBrowserNotification(`Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`, `${fromName} is calling you`);

    CallManager.timeoutTimer = setTimeout(() => {
      if (CallManager.state === 'incoming') {
        endCall('Missed call');
      }
    }, 45000);
  }

  // Accept Incoming Call
  async function acceptIncomingCall() {
    if (CallManager.state !== 'incoming' || !CallManager.pendingOfferSdp) return;

    cancelActiveVoiceRecording();
    stopIncomingRingtone();
    clearTimeout(CallManager.timeoutTimer);

    CallManager.state = 'connecting';
    renderCallOverlay();

    const isVideo = (CallManager.callType === 'video');

    try {
      const constraints = {
        audio: true,
        video: isVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false
      };

      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (isVideo) {
          console.warn('[KYNX WebRTC] Video capture failed, fallback to audio:', err);
          localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          CallManager.callType = 'voice';
        } else {
          throw err;
        }
      }

      CallManager.localStream = localStream;
      if (el.localVideo && isVideo) {
        el.localVideo.srcObject = localStream;
        el.localVideo.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      CallManager.pc = pc;

      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.ontrack = (event) => {
        console.log('[KYNX WebRTC] ontrack received on callee:', event.streams, event.track?.kind);
        attachRemoteTrack(event);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendWsFrame({
            type: 'call_ice_candidate',
            target_id: CallManager.peerId,
            callee_id: CallManager.peerId,
            call_type: CallManager.callType,
            call_id: CallManager.callId,
            candidate: event.candidate.candidate,
            sdp_mid: event.candidate.sdpMid,
            sdp_mline_index: event.candidate.sdpMLineIndex
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('[KYNX WebRTC] Callee connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          onCallConnected();
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          endCall('Connection lost');
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: CallManager.pendingOfferSdp
      }));

      // Flush queued candidates
      for (const cand of CallManager.pendingCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('Could not add queued candidate:', e);
        }
      }
      CallManager.pendingCandidates = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendWsFrame({
        type: 'call_answer',
        target_id: CallManager.peerId,
        callee_id: CallManager.peerId,
        call_type: CallManager.callType,
        call_id: CallManager.callId,
        sdp: answer.sdp
      });

    } catch (err) {
      console.error('[KYNX WebRTC] Failed to accept call:', err);
      alert('Microphone/Camera permission error.');
      declineIncomingCall();
    }
  }

  // Handle Answer from Peer
  async function handleCallAnswer(msg) {
    if (CallManager.state !== 'dialing' && CallManager.state !== 'ringing') return;
    stopRingback();
    clearTimeout(CallManager.timeoutTimer);

    CallManager.state = 'connecting';
    renderCallOverlay();

    try {
      if (CallManager.pc && msg.sdp) {
        await CallManager.pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: msg.sdp
        }));

        for (const cand of CallManager.pendingCandidates) {
          try {
            await CallManager.pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Could not add queued candidate:', e);
          }
        }
        CallManager.pendingCandidates = [];
      }
    } catch (e) {
      console.error('[KYNX WebRTC] Failed to apply remote answer:', e);
      endCall('Failed to connect call');
    }
  }

  // Handle Remote ICE Candidate
  async function handleRemoteIceCandidate(msg) {
    const cand = {
      candidate: msg.candidate,
      sdpMid: msg.sdp_mid || msg.sdpMid,
      sdpMLineIndex: msg.sdp_mline_index !== undefined ? msg.sdp_mline_index : msg.sdpMLineIndex
    };

    if (!CallManager.pc || !CallManager.pc.remoteDescription || !CallManager.pc.remoteDescription.type) {
      CallManager.pendingCandidates.push(cand);
      return;
    }

    try {
      await CallManager.pc.addIceCandidate(new RTCIceCandidate(cand));
    } catch (e) {
      console.warn('[KYNX WebRTC] Error adding ICE candidate:', e);
    }
  }

  // Handle Ringing status from Peer
  function handleCallRinging(msg) {
    if (CallManager.state === 'dialing') {
      CallManager.state = 'ringing';
      renderCallOverlay();
    }
  }

  // Decline Incoming Call
  function declineIncomingCall() {
    if (CallManager.state === 'incoming') {
      sendWsFrame({
        type: 'call_reject',
        target_id: CallManager.peerId,
        callee_id: CallManager.peerId,
        call_type: CallManager.callType,
        call_id: CallManager.callId,
        reason: 'declined'
      });
    }
    endCall('Call declined');
  }

  // Handle Reject from Peer
  function handleCallReject(msg) {
    if (CallManager.state === 'idle') return;
    const incomingId = msg.call_id || msg.callId;
    if (incomingId && CallManager.callId && String(incomingId) !== String(CallManager.callId)) {
      return;
    }
    const reason = (msg.reason === 'busy') ? `${CallManager.peerName} is on another call` : `${CallManager.peerName} declined the call`;
    endCall(reason);
  }

  // Handle Hangup from Peer
  function handleCallHangup(msg) {
    if (CallManager.state === 'idle') return;
    const incomingId = msg.call_id || msg.callId;
    if (incomingId && CallManager.callId && String(incomingId) !== String(CallManager.callId)) {
      return;
    }
    const reason = (msg.reason === 'unavailable') ? `${CallManager.peerName} is unavailable` : 'Call ended';
    endCall(reason);
  }

  // Connected state callback
  function onCallConnected() {
    if (CallManager.state === 'connected') return;
    stopRingback();
    stopIncomingRingtone();
    clearTimeout(CallManager.timeoutTimer);

    CallManager.state = 'connected';
    CallManager.connectedAt = Date.now();

    renderCallOverlay();

    if (CallManager.durationTimer) clearInterval(CallManager.durationTimer);
    CallManager.durationTimer = setInterval(() => {
      if (!CallManager.connectedAt) return;
      const sec = Math.floor((Date.now() - CallManager.connectedAt) / 1000);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      const timeStr = `${m}:${s}`;

      if (el.callTimer) el.callTimer.textContent = timeStr;
      if (el.videoCallStatus) el.videoCallStatus.textContent = timeStr;
      if (el.callMinTimer) el.callMinTimer.textContent = timeStr;
    }, 1000);
  }

  // End Call locally
  function endCall(reason = null) {
    stopRingback();
    stopIncomingRingtone();
    clearTimeout(CallManager.timeoutTimer);
    if (CallManager.durationTimer) {
      clearInterval(CallManager.durationTimer);
      CallManager.durationTimer = null;
    }

    if (CallManager.state === 'dialing' || CallManager.state === 'ringing' || CallManager.state === 'connected' || CallManager.state === 'connecting') {
      sendWsFrame({
        type: 'call_hangup',
        target_id: CallManager.peerId,
        callee_id: CallManager.peerId,
        call_type: CallManager.callType,
        call_id: CallManager.callId,
        reason: reason || 'hangup'
      });
    }

    if (CallManager.localStream) {
      CallManager.localStream.getTracks().forEach(t => {
        try { t.stop(); } catch (_) {}
      });
      CallManager.localStream = null;
    }

    if (CallManager.pc) {
      try { CallManager.pc.close(); } catch (_) {}
      CallManager.pc = null;
    }

    if (el.localVideo) el.localVideo.srcObject = null;
    if (el.remoteVideo) el.remoteVideo.srcObject = null;
    if (el.remoteAudio) el.remoteAudio.srcObject = null;

    const duration = CallManager.connectedAt ? Math.floor((Date.now() - CallManager.connectedAt) / 1000) : 0;
    const oldServerLogId = CallManager.serverLogId;
    const isOutgoing = CallManager.isOutgoing;

    stopScreenShare(false);
    CallManager.reset();
    renderCallOverlay();

    if (reason) {
      showHeadsUpCard('Call Ended', reason);
    }

    if (isOutgoing && oldServerLogId && AppState.token) {
      fetch(`${BACKEND_URL}/api/calls/${oldServerLogId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AppState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: duration > 0 ? 'completed' : 'missed',
          duration_seconds: duration
        })
      }).catch(() => {});
    }
  }

  // In-Call Controls
  function toggleCallMute() {
    if (!CallManager.localStream) return;
    const audioTracks = CallManager.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    CallManager.isMuted = !CallManager.isMuted;
    audioTracks.forEach(t => t.enabled = !CallManager.isMuted);

    if (el.btnCallMuteMic) {
      el.btnCallMuteMic.classList.toggle('muted', CallManager.isMuted);
    }
    if (el.iconMicOn && el.iconMicOff) {
      el.iconMicOn.style.display = CallManager.isMuted ? 'none' : 'block';
      el.iconMicOff.style.display = CallManager.isMuted ? 'block' : 'none';
    }
  }

  function toggleCallVideo() {
    if (!CallManager.localStream) return;
    const videoTracks = CallManager.localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    CallManager.isVideoDisabled = !CallManager.isVideoDisabled;
    videoTracks.forEach(t => t.enabled = !CallManager.isVideoDisabled);

    if (el.btnCallToggleCam) {
      el.btnCallToggleCam.classList.toggle('disabled-track', CallManager.isVideoDisabled);
    }
    if (el.iconCamOn && el.iconCamOff) {
      el.iconCamOn.style.display = CallManager.isVideoDisabled ? 'none' : 'block';
      el.iconCamOff.style.display = CallManager.isVideoDisabled ? 'block' : 'none';
    }
  }

  // Live WebRTC Screen Sharing (Zero-Lag replaceTrack)
  let screenShareStream = null;

  async function toggleScreenShare() {
    if (screenShareStream) {
      stopScreenShare(true);
      return;
    }
    if (!CallManager.pc || CallManager.state === 'idle') {
      showHeadsUpCard('No Active Call', 'Start a video call first to share your screen.');
      return;
    }
    const videoSender = CallManager.pc.getSenders().find(s => s.track && s.track.kind === 'video');
    if (!videoSender) {
      showHeadsUpCard('Start a Video Call', 'Screen sharing requires a Video Call connection.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Your browser does not support screen sharing.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenShareStream = stream;
      await videoSender.replaceTrack(screenTrack);

      if (el.localVideo) {
        el.localVideo.srcObject = stream;
        el.localVideo.play().catch(() => {});
      }
      if (el.btnCallShareScreen) {
        el.btnCallShareScreen.classList.add('sharing');
        el.btnCallShareScreen.title = 'Stop Screen Sharing';
      }
      showHeadsUpCard('Screen Sharing Live 🖥️', 'Your screen is now streaming to the call.');

      screenTrack.onended = () => {
        stopScreenShare(true);
      };
    } catch (err) {
      if (err && err.name !== 'NotAllowedError') {
        console.warn('[KYNX WebRTC] Screen share error:', err);
      }
    }
  }

  function stopScreenShare(restoreCamera = true) {
    if (!screenShareStream) return;
    const stream = screenShareStream;
    screenShareStream = null;
    stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });

    if (el.btnCallShareScreen) {
      el.btnCallShareScreen.classList.remove('sharing');
      el.btnCallShareScreen.title = 'Share Your Screen Live';
    }

    if (restoreCamera && CallManager.pc && CallManager.localStream) {
      const camTrack = CallManager.localStream.getVideoTracks()[0];
      const videoSender = CallManager.pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (videoSender && camTrack) {
        videoSender.replaceTrack(camTrack).catch(() => {});
      }
      if (el.localVideo) {
        el.localVideo.srcObject = CallManager.localStream;
        el.localVideo.play().catch(() => {});
      }
      showHeadsUpCard('Screen Sharing Stopped', 'Switched back to your camera.');
    }
  }

  function toggleCallMinimize() {
    CallManager.isMinimized = !CallManager.isMinimized;
    renderCallOverlay();
  }

  // Load and Render Calls Tab in Sidebar
  async function loadAndRenderCalls() {
    if (!AppState.token) return;
    el.conversationsList.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
        <div class="typing-dots" style="margin-bottom: 12px; justify-content: center;">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        Syncing Call Logs...
      </div>`;

    try {
      const res = await fetch(`${BACKEND_URL}/api/calls`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch calls');
      const calls = await res.json();

      el.conversationsList.innerHTML = '';
      if (!Array.isArray(calls) || calls.length === 0) {
        el.conversationsList.innerHTML = `
          <div style="padding: 36px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
            📞 No recent calls.<br>Start an audio or video call with any contact!
          </div>`;
        return;
      }

      const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;

      calls.forEach(call => {
        const isOutgoing = (call.caller_id === myId);
        const peerName = isOutgoing ? (call.callee_display_name || call.callee_username || 'Peer') : (call.caller_display_name || call.caller_username || 'Caller');
        const initials = peerName.substring(0, 2).toUpperCase();
        const isVideo = (call.call_type === 'video');
        const durationSec = call.duration_seconds || 0;
        const durStr = durationSec > 0 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : (call.status || 'Missed');
        const timeStr = call.created_at ? formatTime(call.created_at) : '';
        const isMissed = (call.status === 'missed' || call.status === 'rejected');

        const card = document.createElement('div');
        card.className = 'chat-item-card';
        card.innerHTML = `
          <div class="item-avatar">${initials}</div>
          <div class="item-info">
            <div class="item-top">
              <span class="item-title">${escapeHtml(peerName)}</span>
              <span class="item-time">${timeStr}</span>
            </div>
            <div class="item-bottom" style="gap: 6px;">
              <span style="font-size: 12px; color: ${isMissed ? '#FF526B' : '#20C997'}; font-weight: 600;">
                ${isOutgoing ? '↗ Outgoing' : '↙ Incoming'} ${isVideo ? 'Video' : 'Voice'} (${durStr})
              </span>
            </div>
          </div>
          <button class="call-btn-cyber" style="width: 34px; height: 34px; flex-shrink: 0;" title="Call Again">
            ${isVideo ? '📹' : '📞'}
          </button>
        `;

        const callBtn = card.querySelector('button');
        callBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = isOutgoing ? call.callee_id : call.caller_id;
          // Find conversation or initiate directly
          const matchedConv = AppState.conversations.find(c => getPeerId(c) === targetId);
          if (matchedConv) {
            openConversation(matchedConv).then(() => initiateCall(call.call_type || 'voice'));
          } else {
            AppState.activeConversation = {
              id: 'temp_' + targetId,
              peer: { id: targetId, display_name: peerName }
            };
            initiateCall(call.call_type || 'voice');
          }
        });

        el.conversationsList.appendChild(card);
      });

    } catch (e) {
      console.warn('Could not load calls:', e);
      el.conversationsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--accent-red); font-size: 13px;">
          Failed to load call history.
        </div>`;
    }
  }

  // Load and Render Contacts Tab in Sidebar
  async function loadAndRenderContacts() {
    if (!AppState.token) return;
    el.conversationsList.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
        <div class="typing-dots" style="margin-bottom: 12px; justify-content: center;">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        Loading Contacts...
      </div>`;

    try {
      const res = await fetch(`${BACKEND_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const contacts = await res.json();

      el.conversationsList.innerHTML = '';
      if (!Array.isArray(contacts) || contacts.length === 0) {
        el.conversationsList.innerHTML = `
          <div style="padding: 36px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
            👥 No contacts yet.<br>Add friends in the KYNX mobile app!
          </div>`;
        return;
      }

      contacts.forEach(contact => {
        const title = contact.display_name || contact.username || 'Contact';
        const initials = title.substring(0, 2).toUpperCase();
        const card = document.createElement('div');
        card.className = 'chat-item-card';
        card.innerHTML = `
          <div class="item-avatar">${initials}</div>
          <div class="item-info">
            <div class="item-top">
              <span class="item-title">${escapeHtml(title)}</span>
              <span class="item-time">@${escapeHtml(contact.username || '')}</span>
            </div>
            <div class="item-bottom">
              <span class="item-preview">${escapeHtml(contact.status_message || 'Online on KYNX')}</span>
            </div>
          </div>
        `;

        card.addEventListener('click', async () => {
          // Open or create conversation
          const existing = AppState.conversations.find(c => getPeerId(c) === contact.id);
          if (existing) {
            openConversation(existing);
          } else {
            try {
              const createRes = await fetch(`${BACKEND_URL}/api/conversations`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${AppState.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipient_id: contact.id })
              });
              if (createRes.ok) {
                const newConv = await createRes.json();
                AppState.conversations.unshift(newConv);
                openConversation(newConv);
              }
            } catch (err) {
              console.warn('Error opening conversation with contact:', err);
            }
          }
        });

        el.conversationsList.appendChild(card);
      });

    } catch (e) {
      console.warn('Could not load contacts:', e);
      el.conversationsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--accent-red); font-size: 13px;">
          Failed to load contacts.
        </div>`;
    }
  }

  // ==========================================================================
  // SIGNATURE AUDIO & NOTIFICATION ENGINE (Exact Phone App Match)
  // ==========================================================================
  let unreadCount = 0;
  const originalTitle = 'KYNX Web Deck — Connect Beyond Limits (Ghost Link)';

  function getNotifAudio() {
    let audio = document.getElementById('kynx-notif-audio');
    if (!audio) {
      audio = new Audio('/assets/kynx_notification.mp3');
      audio.id = 'kynx-notif-audio';
      document.body.appendChild(audio);
    }
    return audio;
  }

  function initAudioSuite() {
    const unlockHandler = () => {
      try {
        const audio = getNotifAudio();
        if (audio) {
          audio.volume = 0.01;
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 1.0;
          }).catch(() => {});
        }
      } catch (err) {}
      document.removeEventListener('click', unlockHandler);
      document.removeEventListener('keydown', unlockHandler);
      document.removeEventListener('touchstart', unlockHandler);
    };

    document.addEventListener('click', unlockHandler, { once: true });
    document.addEventListener('keydown', unlockHandler, { once: true });
    document.addEventListener('touchstart', unlockHandler, { once: true });
  }

  function playNotificationSound() {
    try {
      const audio = getNotifAudio();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1.0;
        const p = audio.play();
        if (p !== undefined) {
          p.catch(err => {
            console.warn('[KYNX Web] Audio playback error:', err);
          });
        }
      }
    } catch (e) {
      console.warn('[KYNX Web] Sound play exception:', e);
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') {
      updateNotifIcon(true);
      return 'granted';
    }
    if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        updateNotifIcon(perm === 'granted');
        return perm;
      } catch (e) {
        return 'default';
      }
    }
    updateNotifIcon(false);
    return Notification.permission;
  }

  function updateNotifIcon(active) {
    if (!el.btnToggleNotif) return;
    if (active) {
      el.btnToggleNotif.style.color = 'var(--accent-green)';
      el.btnToggleNotif.title = 'Notifications Active (Sound & Popups Enabled)';
    } else {
      el.btnToggleNotif.style.color = 'var(--text-muted)';
      el.btnToggleNotif.title = 'Click to Enable Notifications & Audio';
    }
  }

  window.addEventListener('focus', () => {
    unreadCount = 0;
    document.title = originalTitle;
  });

  function triggerMessageNotification(msg) {
    const convId = msg.conversationId || msg.conversation_id;
    const conv = AppState.conversations.find(c => String(c.id) === String(convId));
    const peer = (conv && conv.peer) || {};
    const senderName = msg.senderName || msg.sender_name || peer.display_name || peer.username || (conv && (conv.title || conv.displayName)) || 'KYNX Message';
    const textPreview = msg.text || msg.content || (msg.is_view_once ? '🔒 View-Once Media' : 'Sent an attachment');

    // 1. Play signature notification chime
    playNotificationSound();

    // 2. Tab title badge & flash
    if (document.hidden || !document.hasFocus()) {
      unreadCount++;
      document.title = `(${unreadCount}) ${senderName}: ${textPreview.slice(0, 24)} • KYNX Web`;
    }

    // 3. Desktop Native Notification (Windows / Mac notification banner)
    if (document.hidden || !document.hasFocus() || !AppState.activeConversation || String(AppState.activeConversation.id) !== String(convId)) {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification(senderName, {
            body: textPreview,
            icon: '/assets/kynx-logo.svg',
            badge: '/assets/kynx-logo.svg',
            tag: `kynx-${convId}`,
            renotify: true
          });
          n.onclick = () => {
            window.focus();
            n.close();
            openConversationById(convId);
          };
        } catch (e) {
          console.warn('Native notification error:', e);
        }
      }
    }

    // 4. In-App Heads-Up Banner (Always pop up if not in this active chat or tab is hidden)
    if (!AppState.activeConversation || String(AppState.activeConversation.id) !== String(convId) || document.hidden) {
      showHeadsUpCard(senderName, textPreview, convId);
    }
  }

  function showHeadsUpCard(senderName, textPreview, convId) {
    const container = document.getElementById('kynx-heads-up-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'kynx-heads-up-card';
    const initials = (senderName || 'KG').substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="heads-up-avatar">${escapeHtml(initials)}</div>
      <div class="heads-up-body">
        <div class="heads-up-top">
          <span class="heads-up-name">${escapeHtml(senderName)}</span>
          <span class="heads-up-time">Just now</span>
        </div>
        <div class="heads-up-text">${escapeHtml(textPreview)}</div>
      </div>
      <button class="heads-up-close" title="Dismiss">✕</button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('heads-up-close')) {
        e.stopPropagation();
        card.classList.add('hiding');
        setTimeout(() => card.remove(), 200);
        return;
      }
      openConversationById(convId);
      card.classList.add('hiding');
      setTimeout(() => card.remove(), 200);
    });

    container.appendChild(card);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      if (card.parentNode) {
        card.classList.add('hiding');
        setTimeout(() => card.remove(), 200);
      }
    }, 4500);
  }

  async function openConversationById(convId) {
    if (!convId) return;
    let target = AppState.conversations.find(c => String(c.id) === String(convId));
    if (!target) {
      await loadConversations();
      target = AppState.conversations.find(c => String(c.id) === String(convId));
    }
    if (target) {
      openConversation(target);
    }
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
