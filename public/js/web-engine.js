/**
 * KYNX WEB DECK — CORE ENGINE (v1.0)
 * Engineered by KG • High-Performance Web Messaging, WebSocket Relay & Ghost Shield
 */

(function () {
  'use strict';

  const BACKEND_URL = 'https://kynx-backend.onrender.com';
  const WS_URL = 'wss://kynx-backend.onrender.com/ws';

  let cachedConvsInit = [];
  try {
    cachedConvsInit = JSON.parse(localStorage.getItem('kynx_cached_conversations') || '[]');
  } catch (_) {}

  const AppState = {
    token: localStorage.getItem('kynx_web_token') || null,
    user: JSON.parse(localStorage.getItem('kynx_web_user') || 'null'),
    tempToken: null,
    resetEmail: '',
    resetIdentifier: '',
    audioMuted: localStorage.getItem('kynx_audio_muted') === 'true',
    conversations: Array.isArray(cachedConvsInit) ? cachedConvsInit : [],
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

  function getCachedMessages(convId) {
    if (!convId) return [];
    if (AppState.messages[convId] && AppState.messages[convId].length > 0) {
      return AppState.messages[convId];
    }
    try {
      const raw = localStorage.getItem('kynx_cached_msgs_' + convId);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          AppState.messages[convId] = parsed;
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  }

  function saveCachedMessages(convId, msgs) {
    if (!convId || !Array.isArray(msgs)) return;
    try {
      localStorage.setItem('kynx_cached_msgs_' + convId, JSON.stringify(msgs.slice(-50)));
    } catch (_) {}
  }

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

    // Forgot Password Elements
    btnShowForgot: document.getElementById('btn-show-forgot'),
    forgotReqSection: document.getElementById('forgot-req-section'),
    forgotIdentifier: document.getElementById('forgot-identifier'),
    forgotReqError: document.getElementById('forgot-req-error'),
    btnSendResetOtp: document.getElementById('btn-send-reset-otp'),
    btnBackToLogin: document.getElementById('btn-back-to-login'),
    forgotConfirmSection: document.getElementById('forgot-confirm-section'),
    forgotConfirmMasked: document.getElementById('forgot-confirm-masked'),
    forgotOtp: document.getElementById('forgot-otp'),
    forgotNewPwd: document.getElementById('forgot-new-pwd'),
    forgotConfirmPwd: document.getElementById('forgot-confirm-pwd'),
    forgotConfirmError: document.getElementById('forgot-confirm-error'),
    btnVerifyResetPwd: document.getElementById('btn-verify-reset-pwd'),
    btnBackToForgotReq: document.getElementById('btn-back-to-forgot-req'),
    btnResendResetOtp: document.getElementById('btn-resend-reset-otp'),
    
    // Desktop Deck
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userHandle: document.getElementById('user-handle'),
    btnInstallPwa: document.getElementById('btn-install-pwa'),
    btnLogout: document.getElementById('btn-logout'),
    btnToggleNotif: document.getElementById('btn-toggle-notif'),
    conversationsList: document.getElementById('conversations-list'),
    searchInput: document.getElementById('sidebar-search'),
    contactsBadge: document.getElementById('contacts-badge'),
    navBtnChats: document.getElementById('nav-btn-chats'),
    navBtnUpdates: document.getElementById('nav-btn-updates'),
    navBtnContacts: document.getElementById('nav-btn-contacts'),
    navBtnCalls: document.getElementById('nav-btn-calls'),
    navBtnSettings: document.getElementById('nav-btn-settings'),
    updatesBadgeDot: document.getElementById('updates-badge-dot'),

    // Status Post Modal
    statusPostModal: document.getElementById('status-post-modal'),
    btnCloseStatusModal: document.getElementById('btn-close-status-modal'),
    tabStatusPhoto: document.getElementById('tab-status-photo'),
    tabStatusText: document.getElementById('tab-status-text'),
    statusPhotoContainer: document.getElementById('status-photo-container'),
    statusTextContainer: document.getElementById('status-text-container'),
    statusDropzone: document.getElementById('status-dropzone'),
    statusFileInput: document.getElementById('status-file-input'),
    statusPreviewBox: document.getElementById('status-preview-box'),
    statusPreviewImg: document.getElementById('status-preview-img'),
    statusPlaceholderText: document.getElementById('status-placeholder-text'),
    statusTextInput: document.getElementById('status-text-input'),
    statusTextBgPreview: document.getElementById('status-text-bg-preview'),
    statusCaptionGroup: document.getElementById('status-caption-group'),
    statusCaptionInput: document.getElementById('status-caption-input'),
    statusPostError: document.getElementById('status-post-error'),
    btnSubmitStatus: document.getElementById('btn-submit-status'),

    // Story Viewer Modal
    statusViewerModal: document.getElementById('status-viewer-modal'),
    btnCloseStoryViewer: document.getElementById('btn-close-story-viewer'),
    btnStoryDelete: document.getElementById('btn-story-delete'),
    storyProgressBarWrap: document.getElementById('story-progress-bar-wrap'),
    storyProgressFill: document.getElementById('story-progress-fill'),
    storyUserAvatar: document.getElementById('story-user-avatar'),
    storyUserName: document.getElementById('story-user-name'),
    storyTimeText: document.getElementById('story-time-text'),
    storyContentBox: document.getElementById('story-content-box'),
    storyContentImg: document.getElementById('story-content-img'),
    storyContentText: document.getElementById('story-content-text'),
    storyCaptionText: document.getElementById('story-caption-text'),
    storyViewsText: document.getElementById('story-views-text'),
    
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
    menuBtnViewProfile: document.getElementById('menu-btn-view-profile'),
    menuBtnWalkieTalkie: document.getElementById('menu-btn-walkie-talkie'),
    menuBtnWatchTogether: document.getElementById('menu-btn-watch-together'),
    menuBtnAirdrop: document.getElementById('menu-btn-airdrop'),
    menuBtnClearChat: document.getElementById('menu-btn-clear-chat'),
    menuBtnRemoveFriend: document.getElementById('menu-btn-remove-friend'),
    menuBtnBlockUser: document.getElementById('menu-btn-block-user'),
    menuTextBlock: document.getElementById('menu-text-block'),
    chatPeerDetails: document.querySelector('.chat-peer-details'),
    userProfileBadge: document.querySelector('.user-profile-badge'),

    // Profile Modal Elements
    profileModal: document.getElementById('user-profile-modal'),
    profileModalTitle: document.getElementById('profile-modal-title'),
    btnCloseProfileModal: document.getElementById('btn-close-profile-modal'),
    profileModalAvatar: document.getElementById('profile-modal-avatar'),
    profileModalOnlineDot: document.getElementById('profile-modal-online-dot'),
    profileModalDisplayName: document.getElementById('profile-modal-display-name'),
    profileModalVerified: document.getElementById('profile-modal-verified'),
    profileModalHandle: document.getElementById('profile-modal-handle'),
    profileModalStatusText: document.getElementById('profile-modal-status-text'),
    profileModalBio: document.getElementById('profile-modal-bio'),
    profileSelfEditWrap: document.getElementById('profile-self-edit-wrap'),
    profileEditNameInput: document.getElementById('profile-edit-name-input'),
    profileEditBioInput: document.getElementById('profile-edit-bio-input'),
    btnSaveSelfProfile: document.getElementById('btn-save-self-profile'),
    btnSelfProfileLogout: document.getElementById('btn-self-profile-logout'),
    profilePeerActions: document.getElementById('profile-peer-actions'),
    btnProfileMessage: document.getElementById('btn-profile-message'),
    btnProfileVoiceCall: document.getElementById('btn-profile-voice-call'),
    btnProfileVideoCall: document.getElementById('btn-profile-video-call'),
    btnProfileRemoveFriend: document.getElementById('btn-profile-remove-friend'),
    btnProfileBlockUser: document.getElementById('btn-profile-block-user'),
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
    btnVideoCall: document.getElementById('btn-start-video-call'),

    // Build 56 Power Features: Burn-After-Reading, Watch Together, Walkie-Talkie
    btnWalkieTalkie: document.getElementById('btn-walkie-talkie'),
    btnWatchTogether: document.getElementById('btn-watch-together'),
    watchDrawer: document.getElementById('watch-together-drawer'),
    watchLiveDot: document.getElementById('watch-live-dot'),
    watchTimeBadge: document.getElementById('watch-time-badge'),
    watchUrlInput: document.getElementById('watch-url-input'),
    btnWatchLoad: document.getElementById('btn-watch-load'),
    btnWatchLofi: document.getElementById('btn-watch-lofi'),
    btnWatchSynth: document.getElementById('btn-watch-synth'),
    btnWatchClose: document.getElementById('btn-watch-close'),
    watchStageWrap: document.getElementById('watch-stage-wrap'),
    watchYtIframe: document.getElementById('watch-yt-iframe'),
    btnWatchBack10: document.getElementById('btn-watch-back10'),
    btnWatchToggle: document.getElementById('btn-watch-toggle'),
    btnWatchFwd10: document.getElementById('btn-watch-fwd10'),
    btnWatchSync: document.getElementById('btn-watch-sync'),
    pttHoldBar: document.getElementById('ptt-hold-bar'),
    btnPttExit: document.getElementById('btn-ptt-exit'),
    btnPttHold: document.getElementById('btn-ptt-hold'),
    chatFooterControls: document.getElementById('chat-footer-controls'),
    btnBurnTimer: document.getElementById('btn-burn-timer')
  };

  // ==========================================================================
  // BUILD 56 POWER PROTOCOLS (Cross-Platform Android <-> Web Deck)
  // ==========================================================================
  const PowerState = {
    burnSeconds: 0,
    walkieMode: false,
    pttRecording: false,
    pttRecorder: null,
    pttStream: null,
    pttChunks: [],
    pttStartedAt: 0,
    pttTimer: null,
    pttAudioEl: null,
    seenPttIds: new Set(),
    chatHistorySeeded: false,
    watchVideoId: null,
    watchPlaying: false,
    watchSec: 0,
    watchTickTimer: null,
    lastWatchMsgId: null
  };

  function parseBurnMessage(raw) {
    if (!raw || typeof raw !== 'string' || !raw.startsWith('[[KYNX_BURN:')) return null;
    const m = raw.match(/^\[\[KYNX_BURN:(\d{1,3})\]\]([\s\S]*)$/);
    if (!m) return null;
    return { seconds: Math.min(300, Math.max(5, parseInt(m[1], 10) || 10)), body: m[2] };
  }

  function parseWatchMessage(raw) {
    if (!raw || typeof raw !== 'string' || !raw.startsWith('[[KYNX_WATCH:') || !raw.endsWith(']]')) return null;
    try {
      const obj = JSON.parse(raw.slice('[[KYNX_WATCH:'.length, -2));
      const v = String(obj.v || '');
      const a = String(obj.a || 'play');
      const t = Math.max(0, parseInt(obj.t, 10) || 0);
      if (a !== 'close' && !/^[A-Za-z0-9_-]{11}$/.test(v)) return null;
      return { videoId: v, action: a, timeSec: t, ts: obj.ts || Date.now() };
    } catch (_) {
      return null;
    }
  }

  function isPttMessage(raw, mediaType) {
    if (!raw || typeof raw !== 'string') return false;
    const trimmed = raw.trim();
    if (trimmed === '[[KYNX_PTT]]' && (!mediaType || String(mediaType).includes('audio'))) return true;
    return trimmed.startsWith('[[KYNX_MESH_PTT:') && trimmed.endsWith(']]');
  }

  function formatPowerPreview(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    if (parseBurnMessage(raw)) return '🔥 Secret burn message';
    if (parseWatchMessage(raw)) return '🎵 Watch Together room';
    if (isPttMessage(raw)) return '📻 Walkie-Talkie burst';
    return raw;
  }

  function extractYouTubeId(input) {
    if (!input) return null;
    const s = input.trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?.*v=)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function encodeWatchCommand(videoId, action, timeSec) {
    return `[[KYNX_WATCH:${JSON.stringify({ v: videoId || '', a: action, t: Math.max(0, Math.floor(timeSec || 0)), ts: Date.now() })}]]`;
  }

  function formatWatchSec(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function getBurnedIdsSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem('kynx_burned_ids') || '[]'));
    } catch (_) {
      return new Set();
    }
  }

  function markBurnedId(msgId) {
    if (!msgId) return;
    const set = getBurnedIdsSet();
    set.add(String(msgId));
    const arr = Array.from(set).slice(-400);
    try { localStorage.setItem('kynx_burned_ids', JSON.stringify(arr)); } catch (_) {}
  }

  function playRadioChirp(isStart) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const now = ctx.currentTime;
      if (isStart) {
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(1180, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.09);
      }
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
      setTimeout(() => { try { ctx.close(); } catch (_) {} }, 250);
    } catch (_) {}
  }

  function playPttAudioUrl(mediaUrl, withChirp = true) {
    if (!mediaUrl) return;
    if (withChirp) playRadioChirp(true);
    try {
      if (PowerState.pttAudioEl) {
        PowerState.pttAudioEl.pause();
        PowerState.pttAudioEl = null;
      }
      const audio = new Audio(mediaUrl);
      PowerState.pttAudioEl = audio;
      setTimeout(() => {
        audio.play().catch(err => console.warn('[KYNX PTT] Autoplay blocked until interaction:', err));
      }, withChirp ? 120 : 0);
    } catch (e) {
      console.warn('[KYNX PTT] Playback error:', e);
    }
  }

  function updateBurnTimerButton() {
    if (!el.btnBurnTimer) return;
    const sec = PowerState.burnSeconds;
    if (sec > 0) {
      const lbl = sec === 60 ? '1m' : `${sec}s`;
      el.btnBurnTimer.classList.add('active');
      el.btnBurnTimer.textContent = `🔥 ${lbl}`;
      if (el.msgInput) {
        el.msgInput.classList.add('burn-armed');
        el.msgInput.placeholder = `🔥 Burn in ${lbl} • Type secret message...`;
      }
    } else {
      el.btnBurnTimer.classList.remove('active');
      el.btnBurnTimer.textContent = '🔥';
      if (el.msgInput) {
        el.msgInput.classList.remove('burn-armed');
        el.msgInput.placeholder = 'Type a message (Enter to send, Shift+Enter for new line)...';
      }
    }
  }

  function setWalkieTalkieMode(enabled) {
    PowerState.walkieMode = Boolean(enabled);
    if (el.btnWalkieTalkie) el.btnWalkieTalkie.classList.toggle('active', PowerState.walkieMode);
    if (el.pttHoldBar) el.pttHoldBar.style.display = PowerState.walkieMode ? 'block' : 'none';
    if (el.chatFooterControls) el.chatFooterControls.style.display = PowerState.walkieMode ? 'none' : 'flex';
    if (!PowerState.walkieMode && PowerState.pttRecording) {
      stopPttTransmit(true);
    }
  }

  function ytPostCmd(func, args = []) {
    if (!el.watchYtIframe || !el.watchYtIframe.contentWindow) return;
    try {
      el.watchYtIframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
    } catch (_) {}
  }

  function updateWatchUi() {
    if (!el.watchDrawer) return;
    if (el.btnWatchTogether) el.btnWatchTogether.classList.toggle('active', Boolean(PowerState.watchVideoId));
    if (el.watchTimeBadge) el.watchTimeBadge.textContent = formatWatchSec(PowerState.watchSec);
    if (el.watchLiveDot) el.watchLiveDot.style.background = PowerState.watchPlaying ? '#10b981' : '#f59e0b';
    if (el.btnWatchToggle) el.btnWatchToggle.textContent = PowerState.watchPlaying ? '⏸ Pause All' : '▶ Play All';
  }

  function startWatchTicker() {
    if (PowerState.watchTickTimer) clearInterval(PowerState.watchTickTimer);
    PowerState.watchTickTimer = setInterval(() => {
      if (PowerState.watchPlaying && PowerState.watchVideoId) {
        PowerState.watchSec++;
        updateWatchUi();
      }
    }, 1000);
  }

  function applyWatchCommandLocally(cmd) {
    if (!cmd || !el.watchDrawer) return;
    if (cmd.action === 'close') {
      PowerState.watchVideoId = null;
      PowerState.watchPlaying = false;
      if (PowerState.watchTickTimer) { clearInterval(PowerState.watchTickTimer); PowerState.watchTickTimer = null; }
      if (el.watchYtIframe) el.watchYtIframe.src = 'about:blank';
      if (el.watchStageWrap) el.watchStageWrap.style.display = 'none';
      el.watchDrawer.style.display = 'none';
      updateWatchUi();
      return;
    }

    el.watchDrawer.style.display = 'block';
    if (el.watchStageWrap) el.watchStageWrap.style.display = 'block';
    const needsReload = PowerState.watchVideoId !== cmd.videoId;
    PowerState.watchVideoId = cmd.videoId;
    PowerState.watchSec = cmd.timeSec || 0;
    PowerState.watchPlaying = (cmd.action !== 'pause');

    if (needsReload && el.watchYtIframe) {
      const auto = PowerState.watchPlaying ? 1 : 0;
      const origin = encodeURIComponent(window.location.origin);
      el.watchYtIframe.src = `https://www.youtube.com/embed/${encodeURIComponent(cmd.videoId)}?enablejsapi=1&autoplay=${auto}&start=${PowerState.watchSec}&rel=0&playsinline=1&origin=${origin}`;
    } else {
      ytPostCmd('seekTo', [PowerState.watchSec, true]);
      ytPostCmd(PowerState.watchPlaying ? 'playVideo' : 'pauseVideo');
    }
    startWatchTicker();
    updateWatchUi();
  }

  async function broadcastWatchSync(videoId, action, timeSec) {
    if (!AppState.activeConversation || !AppState.token) return;
    const text = encodeWatchCommand(videoId, action, timeSec);
    applyWatchCommandLocally({ videoId, action, timeSec, ts: Date.now() });
    const convId = AppState.activeConversation.id;
    const tempId = 'kynx_watch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : 'me';
    const msgObj = {
      id: tempId,
      client_msg_id: tempId,
      conversation_id: convId,
      text,
      sender_id: myId,
      created_at: new Date().toISOString(),
      isMine: true
    };
    if (!AppState.messages[convId]) AppState.messages[convId] = [];
    AppState.messages[convId].push(msgObj);
    PowerState.lastWatchMsgId = tempId;
    appendMessageToUI(msgObj);
    scrollChatToBottom();
    await postMessagePayload(convId, { conversation_id: convId, text, client_msg_id: tempId }, msgObj, tempId);
  }

  async function startPttTransmit() {
    if (PowerState.pttRecording || !AppState.activeConversation || !AppState.token) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support Walkie-Talkie microphone recording.');
      return;
    }
    try {
      cancelActiveVoiceRecording();
      PowerState.pttStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/aac')) mimeType = 'audio/aac';
      }
      PowerState.pttRecorder = mimeType
        ? new MediaRecorder(PowerState.pttStream, { mimeType, audioBitsPerSecond: 32000 })
        : new MediaRecorder(PowerState.pttStream);
      PowerState.pttChunks = [];
      PowerState.pttRecording = true;
      PowerState.pttStartedAt = Date.now();
      playRadioChirp(true);

      if (el.btnPttHold) {
        el.btnPttHold.classList.add('transmitting');
        el.btnPttHold.textContent = '🔴 TRANSMITTING 0:00 • Release to Send';
      }
      if (PowerState.pttTimer) clearInterval(PowerState.pttTimer);
      PowerState.pttTimer = setInterval(() => {
        const sec = Math.floor((Date.now() - PowerState.pttStartedAt) / 1000);
        if (el.btnPttHold && PowerState.pttRecording) {
          el.btnPttHold.textContent = `🔴 TRANSMITTING 0:${String(sec).padStart(2, '0')} • Release to Send`;
        }
        if (sec >= 30) stopPttTransmit(false);
      }, 300);

      PowerState.pttRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) PowerState.pttChunks.push(ev.data);
      };
      PowerState.pttRecorder.start();
    } catch (err) {
      PowerState.pttRecording = false;
      showHeadsUpCard('Microphone Needed', 'Allow mic permission to use Walkie-Talkie.');
    }
  }

  function stopPttTransmit(cancelOnly = false) {
    if (!PowerState.pttRecording) return;
    PowerState.pttRecording = false;
    if (PowerState.pttTimer) { clearInterval(PowerState.pttTimer); PowerState.pttTimer = null; }
    if (el.btnPttHold) {
      el.btnPttHold.classList.remove('transmitting');
      el.btnPttHold.textContent = '📻 HOLD TO TALK (or Hold Space) • Instant Voice';
    }
    const elapsed = Date.now() - PowerState.pttStartedAt;
    const rec = PowerState.pttRecorder;
    const stream = PowerState.pttStream;
    PowerState.pttRecorder = null;
    PowerState.pttStream = null;
    playRadioChirp(false);

    if (!rec) {
      if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
      return;
    }

    rec.onstop = async () => {
      if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
      const chunks = PowerState.pttChunks.slice();
      PowerState.pttChunks = [];
      if (cancelOnly || elapsed < 350 || chunks.length === 0 || !AppState.activeConversation) return;

      const blobType = rec.mimeType || (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');
      const blob = new Blob(chunks, { type: blobType });
      let ext = 'webm';
      if ((blob.type || '').includes('mp4') || (blob.type || '').includes('aac')) ext = 'm4a';
      else if ((blob.type || '').includes('ogg')) ext = 'ogg';
      const file = new File([blob], `ptt_${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' });

      try {
        const formData = new FormData();
        formData.append('file', file);
        const upRes = await fetch(`${BACKEND_URL}/api/media/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${AppState.token}` },
          body: formData
        });
        if (!upRes.ok) throw new Error('Walkie-Talkie upload failed');
        const uploaded = await upRes.json();
        const convId = AppState.activeConversation.id;
        const tempId = 'kynx_ptt_' + Date.now();
        const msgRes = await fetch(`${BACKEND_URL}/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AppState.token}`
          },
          body: JSON.stringify({
            conversation_id: convId,
            text: '[[KYNX_PTT]]',
            client_msg_id: tempId,
            media_url: uploaded.url,
            media_type: 'audio'
          })
        });
        if (msgRes.ok) {
          const saved = await msgRes.json();
          PowerState.seenPttIds.add(saved.id);
          if (!AppState.messages[convId]) AppState.messages[convId] = [];
          AppState.messages[convId].push(saved);
          appendMessageToUI(saved);
          scrollChatToBottom();
          loadConversations();
        }
      } catch (err) {
        showHeadsUpCard('Walkie-Talkie Failed', err.message || 'Could not send voice burst.');
      }
    };

    try {
      if (rec.state !== 'inactive') rec.stop();
    } catch (_) {
      if (stream) stream.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
    }
  }

  // Initialize Web Deck
  function init() {
    bindEvents();

    // Dev test hook for automated verification in sandboxed browser
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('mock_auth')) {
      AppState.token = 'dev_test_token';
      AppState.user = { id: 'kg_1', displayName: 'Kavyansh (KG)', username: 'kavyansh' };
      try {
        localStorage.setItem('kynx_web_token', AppState.token);
        localStorage.setItem('kynx_web_user', JSON.stringify(AppState.user));
      } catch (_) {}
      hideAuth();
      showDeck();

      if (urlParams.has('mock_chat')) {
        setTimeout(() => {
          openConversation({
            id: 'conv_123',
            peer: { id: 'peer_1', display_name: 'Gaurav Gautam', username: 'gaurav', is_online: true }
          });
        }, 250);
      }
      return;
    }

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
      if (!isDirect) {
        el.loginForm.style.display = 'block';
        if (el.otpSection) el.otpSection.style.display = 'none';
        if (el.forgotReqSection) el.forgotReqSection.style.display = 'none';
        if (el.forgotConfirmSection) el.forgotConfirmSection.style.display = 'none';
      }
    });

    // Handle Direct Login Form
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleDirectLogin();
    });

    // Forgot Password triggers
    if (el.btnShowForgot) {
      el.btnShowForgot.addEventListener('click', () => {
        el.loginForm.style.display = 'none';
        if (el.otpSection) el.otpSection.style.display = 'none';
        if (el.forgotConfirmSection) el.forgotConfirmSection.style.display = 'none';
        if (el.forgotReqSection) {
          el.forgotReqSection.style.display = 'block';
          if (el.loginIdentifier && el.loginIdentifier.value.trim() && el.forgotIdentifier) {
            el.forgotIdentifier.value = el.loginIdentifier.value.trim();
          }
          if (el.forgotReqError) el.forgotReqError.textContent = '';
          if (el.forgotIdentifier) el.forgotIdentifier.focus();
        }
      });
    }

    if (el.btnBackToLogin) {
      el.btnBackToLogin.addEventListener('click', () => {
        if (el.forgotReqSection) el.forgotReqSection.style.display = 'none';
        if (el.forgotConfirmSection) el.forgotConfirmSection.style.display = 'none';
        el.loginForm.style.display = 'block';
      });
    }

    if (el.btnBackToForgotReq) {
      el.btnBackToForgotReq.addEventListener('click', () => {
        if (el.forgotConfirmSection) el.forgotConfirmSection.style.display = 'none';
        if (el.forgotReqSection) el.forgotReqSection.style.display = 'block';
      });
    }

    if (el.btnSendResetOtp) {
      el.btnSendResetOtp.addEventListener('click', handleSendResetOtp);
    }
    if (el.forgotIdentifier) {
      el.forgotIdentifier.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSendResetOtp();
        }
      });
    }

    if (el.btnVerifyResetPwd) {
      el.btnVerifyResetPwd.addEventListener('click', handleConfirmResetPwd);
    }
    const handleResetEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmResetPwd();
      }
    };
    if (el.forgotOtp) el.forgotOtp.addEventListener('keydown', handleResetEnter);
    if (el.forgotNewPwd) el.forgotNewPwd.addEventListener('keydown', handleResetEnter);
    if (el.forgotConfirmPwd) el.forgotConfirmPwd.addEventListener('keydown', handleResetEnter);

    if (el.btnResendResetOtp) {
      el.btnResendResetOtp.addEventListener('click', handleResendResetOtp);
    }

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

    // Logout (Sidebar Header & Profile Modal)
    if (el.btnLogout) {
      el.btnLogout.addEventListener('click', () => logout(true));
    }
    if (el.btnSelfProfileLogout) {
      el.btnSelfProfileLogout.addEventListener('click', () => logout(true));
    }

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

    // Walkie-Talkie & Watch Together in 3-dots menu (Accessible on mobile)
    if (el.menuBtnWalkieTalkie) {
      el.menuBtnWalkieTalkie.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (el.btnWalkieTalkie) el.btnWalkieTalkie.click();
      });
    }

    if (el.menuBtnWatchTogether) {
      el.menuBtnWatchTogether.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (el.btnWatchTogether) el.btnWatchTogether.click();
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

    // View Profile inside 3-dots menu
    if (el.menuBtnViewProfile) {
      el.menuBtnViewProfile.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (!AppState.activeConversation) return;
        const peerId = getPeerId(AppState.activeConversation);
        if (peerId) openUserProfileModal(peerId, false);
      });
    }

    // Remove Contact (Unfriend) inside 3-dots menu
    if (el.menuBtnRemoveFriend) {
      el.menuBtnRemoveFriend.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (!AppState.activeConversation) return;
        const peerId = getPeerId(AppState.activeConversation);
        const peer = AppState.activeConversation.peer || {};
        const name = peer.display_name || peer.username || 'this user';
        if (peerId) removeContact(peerId, name);
      });
    }

    // Block User inside 3-dots menu
    if (el.menuBtnBlockUser) {
      el.menuBtnBlockUser.addEventListener('click', () => {
        if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';
        if (!AppState.activeConversation) return;
        const peerId = getPeerId(AppState.activeConversation);
        const peer = AppState.activeConversation.peer || {};
        const name = peer.display_name || peer.username || 'this user';
        const isBlocked = Boolean(peer.is_blocked);
        if (peerId) toggleBlockUser(peerId, name, isBlocked);
      });
    }

    // Tap Chat Peer Header -> Open Peer Profile & Bio Modal
    if (el.chatPeerDetails) {
      el.chatPeerDetails.addEventListener('click', (e) => {
        if (e.target.closest('#btn-mobile-back')) return;
        if (!AppState.activeConversation) return;
        const peerId = getPeerId(AppState.activeConversation);
        if (peerId) openUserProfileModal(peerId, false);
      });
    }

    // Tap Sidebar User Profile -> Open Self Profile & Edit Bio Modal
    if (el.userProfileBadge) {
      el.userProfileBadge.addEventListener('click', () => {
        const myId = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
        if (myId) openUserProfileModal(myId, true);
      });
    }

    // Profile Modal Listeners
    if (el.btnCloseProfileModal) {
      el.btnCloseProfileModal.addEventListener('click', () => {
        if (el.profileModal) el.profileModal.style.display = 'none';
      });
    }

    if (el.profileModal) {
      el.profileModal.addEventListener('click', (e) => {
        if (e.target === el.profileModal) {
          el.profileModal.style.display = 'none';
        }
      });
    }

    if (el.btnSaveSelfProfile) {
      el.btnSaveSelfProfile.addEventListener('click', saveSelfProfile);
    }

    if (el.btnProfileMessage) {
      el.btnProfileMessage.addEventListener('click', async () => {
        if (!currentProfileTarget) return;
        if (el.profileModal) el.profileModal.style.display = 'none';
        const targetId = currentProfileTarget.id;
        const existing = AppState.conversations.find(c => getPeerId(c) === targetId);
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
              body: JSON.stringify({ recipient_id: targetId })
            });
            if (createRes.ok) {
              const newConv = await createRes.json();
              AppState.conversations.unshift(newConv);
              openConversation(newConv);
            }
          } catch (err) {
            console.warn('Error opening conversation from profile:', err);
          }
        }
      });
    }

    if (el.btnProfileVoiceCall) {
      el.btnProfileVoiceCall.addEventListener('click', () => {
        if (el.profileModal) el.profileModal.style.display = 'none';
        initiateCall('voice');
      });
    }

    if (el.btnProfileVideoCall) {
      el.btnProfileVideoCall.addEventListener('click', () => {
        if (el.profileModal) el.profileModal.style.display = 'none';
        initiateCall('video');
      });
    }

    if (el.btnProfileRemoveFriend) {
      el.btnProfileRemoveFriend.addEventListener('click', () => {
        if (!currentProfileTarget) return;
        removeContact(currentProfileTarget.id, currentProfileTarget.display_name || currentProfileTarget.username);
      });
    }

    if (el.btnProfileBlockUser) {
      el.btnProfileBlockUser.addEventListener('click', () => {
        if (!currentProfileTarget) return;
        toggleBlockUser(currentProfileTarget.id, currentProfileTarget.display_name || currentProfileTarget.username, Boolean(currentProfileTarget.is_blocked));
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

    // Build 56 Power Feature Bindings: Burn-After-Reading, Watch Together, Walkie-Talkie
    if (el.btnBurnTimer) {
      el.btnBurnTimer.addEventListener('click', () => {
        const order = [0, 10, 30, 60];
        const nextIdx = (order.indexOf(PowerState.burnSeconds) + 1) % order.length;
        PowerState.burnSeconds = order[nextIdx];
        updateBurnTimerButton();
        if (el.msgInput) el.msgInput.focus();
      });
    }

    if (el.btnWalkieTalkie) {
      el.btnWalkieTalkie.addEventListener('click', () => {
        setWalkieTalkieMode(!PowerState.walkieMode);
      });
    }
    if (el.btnPttExit) {
      el.btnPttExit.addEventListener('click', () => setWalkieTalkieMode(false));
    }
    if (el.btnPttHold) {
      el.btnPttHold.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startPttTransmit();
      });
      const releasePtt = () => stopPttTransmit(false);
      el.btnPttHold.addEventListener('pointerup', releasePtt);
      el.btnPttHold.addEventListener('pointercancel', releasePtt);
      el.btnPttHold.addEventListener('pointerleave', releasePtt);
    }
    window.addEventListener('keydown', (e) => {
      if (!PowerState.walkieMode || e.code !== 'Space' || e.repeat) return;
      const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      e.preventDefault();
      startPttTransmit();
    });
    window.addEventListener('keyup', (e) => {
      if (!PowerState.walkieMode || e.code !== 'Space') return;
      if (PowerState.pttRecording) {
        e.preventDefault();
        stopPttTransmit(false);
      }
    });

    if (el.btnWatchTogether && el.watchDrawer) {
      el.btnWatchTogether.addEventListener('click', () => {
        const isOpen = el.watchDrawer.style.display !== 'none';
        el.watchDrawer.style.display = isOpen ? 'none' : 'block';
        if (!isOpen && el.watchUrlInput) el.watchUrlInput.focus();
      });
    }
    if (el.btnWatchLoad && el.watchUrlInput) {
      const loadFromInput = () => {
        const id = extractYouTubeId(el.watchUrlInput.value);
        if (!id) {
          showHeadsUpCard('Invalid YouTube Link', 'Paste a valid YouTube URL or 11-character video ID.');
          return;
        }
        el.watchUrlInput.value = '';
        broadcastWatchSync(id, 'play', 0);
      };
      el.btnWatchLoad.addEventListener('click', loadFromInput);
      el.watchUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); loadFromInput(); }
      });
    }
    if (el.btnWatchLofi) el.btnWatchLofi.addEventListener('click', () => broadcastWatchSync('jfKfPfyJRdk', 'play', 0));
    if (el.btnWatchSynth) el.btnWatchSynth.addEventListener('click', () => broadcastWatchSync('4xDzrJKXOOY', 'play', 0));
    if (el.btnWatchClose) {
      el.btnWatchClose.addEventListener('click', () => {
        if (PowerState.watchVideoId) {
          broadcastWatchSync(PowerState.watchVideoId, 'close', 0);
        } else if (el.watchDrawer) {
          el.watchDrawer.style.display = 'none';
        }
      });
    }
    if (el.btnWatchToggle) {
      el.btnWatchToggle.addEventListener('click', () => {
        if (!PowerState.watchVideoId) return;
        broadcastWatchSync(PowerState.watchVideoId, PowerState.watchPlaying ? 'pause' : 'play', PowerState.watchSec);
      });
    }
    if (el.btnWatchBack10) {
      el.btnWatchBack10.addEventListener('click', () => {
        if (!PowerState.watchVideoId) return;
        broadcastWatchSync(PowerState.watchVideoId, 'seek', Math.max(0, PowerState.watchSec - 10));
      });
    }
    if (el.btnWatchFwd10) {
      el.btnWatchFwd10.addEventListener('click', () => {
        if (!PowerState.watchVideoId) return;
        broadcastWatchSync(PowerState.watchVideoId, 'seek', PowerState.watchSec + 10);
      });
    }
    if (el.btnWatchSync) {
      el.btnWatchSync.addEventListener('click', () => {
        if (!PowerState.watchVideoId) return;
        broadcastWatchSync(PowerState.watchVideoId, PowerState.watchPlaying ? 'play' : 'pause', PowerState.watchSec);
      });
    }

    if (el.btnMobileBack) {
      el.btnMobileBack.addEventListener('click', () => {
        if (history.state && history.state.kynxChatOpen) {
          history.back();
        } else if (el.webApp) {
          el.webApp.classList.remove('mobile-chat-open');
        }
      });
    }

    // Native Mobile Back Swipe / Browser Back Navigation
    window.addEventListener('popstate', () => {
      if (el.webApp && el.webApp.classList.contains('mobile-chat-open')) {
        el.webApp.classList.remove('mobile-chat-open');
      }
    });

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
        if (Date.now() - (window.__lastActionsOpenTime || 0) < 450) return;
        if (!e.target.closest('.msg-bubble-wrapper')) {
          document.querySelectorAll('.msg-bubble-wrapper.show-actions').forEach(m => m.classList.remove('show-actions'));
        }
      });
      document.addEventListener('touchstart', (e) => {
        if (Date.now() - (window.__lastActionsOpenTime || 0) < 450) return;
        if (!e.target.closest('.msg-bubble-wrapper')) {
          document.querySelectorAll('.msg-bubble-wrapper.show-actions').forEach(m => m.classList.remove('show-actions'));
        }
      }, { passive: true });
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

    // Sidebar navigation tabs (Chats, Updates, Contacts, Calls, Settings)
    document.querySelectorAll('.sidebar-nav-tabs .nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav-tabs .nav-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.textContent.trim().toLowerCase();

        const searchWrapper = document.querySelector('.sidebar-search-box');
        if (searchWrapper && el.searchInput) {
          if (tabName.includes('settings')) {
            searchWrapper.style.display = 'none';
          } else {
            searchWrapper.style.display = 'block';
            if (tabName.includes('chats')) el.searchInput.placeholder = 'Search chats, contacts, messages...';
            else if (tabName.includes('updates')) el.searchInput.placeholder = 'Search updates...';
            else if (tabName.includes('contacts')) el.searchInput.placeholder = 'Search contacts circle...';
            else if (tabName.includes('calls')) el.searchInput.placeholder = 'Search call logs...';
          }
        }

        if (tabName.includes('chats')) {
          AppState.activeTab = 'chats';
          renderConversations();
          if (AppState.searchQuery) filterConversations(AppState.searchQuery);
        } else if (tabName.includes('updates')) {
          AppState.activeTab = 'updates';
          if (el.updatesBadgeDot) el.updatesBadgeDot.style.display = 'none';
          loadAndRenderUpdates();
        } else if (tabName.includes('calls')) {
          AppState.activeTab = 'calls';
          loadAndRenderCalls();
        } else if (tabName.includes('contacts')) {
          AppState.activeTab = 'contacts';
          loadAndRenderContacts();
        } else if (tabName.includes('settings')) {
          AppState.activeTab = 'settings';
          loadAndRenderSettings();
        }
      });
    });

    // Status Post Modal wiring
    if (el.btnCloseStatusModal) el.btnCloseStatusModal.addEventListener('click', closeStatusPostModal);
    if (el.statusPostModal) {
      el.statusPostModal.addEventListener('click', (e) => {
        if (e.target === el.statusPostModal) closeStatusPostModal();
      });
    }
    if (el.tabStatusPhoto) {
      el.tabStatusPhoto.addEventListener('click', () => switchStatusMode('photo'));
    }
    if (el.tabStatusText) {
      el.tabStatusText.addEventListener('click', () => switchStatusMode('text'));
    }
    if (el.statusDropzone && el.statusFileInput) {
      el.statusDropzone.addEventListener('click', () => el.statusFileInput.click());
      el.statusFileInput.addEventListener('change', handleStatusFileSelect);
    }
    document.querySelectorAll('.gradient-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const grad = dot.dataset.grad;
        if (el.statusTextBgPreview && grad) {
          el.statusTextBgPreview.style.background = grad;
          document.querySelectorAll('.gradient-dot').forEach(d => d.style.borderColor = 'transparent');
          dot.style.borderColor = '#fff';
        }
      });
    });
    if (el.btnSubmitStatus) el.btnSubmitStatus.addEventListener('click', submitStatusPost);

    // Story Viewer Modal wiring
    if (el.btnCloseStoryViewer) el.btnCloseStoryViewer.addEventListener('click', closeStoryViewer);
    if (el.statusViewerModal) {
      el.statusViewerModal.addEventListener('click', (e) => {
        if (e.target === el.statusViewerModal) closeStoryViewer();
      });
    }
    if (el.storyContentBox) {
      el.storyContentBox.addEventListener('click', (e) => {
        if (e.target.closest('#btn-story-delete') || e.target.closest('#btn-close-story-viewer')) return;
        const rect = el.storyContentBox.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        if (clickX < rect.width * 0.35) {
          // Tap left -> previous story
          if (currentViewingIndex > 0) {
            currentViewingIndex--;
            renderCurrentStoryItem();
          } else {
            renderCurrentStoryItem();
          }
        } else {
          // Tap right -> next story
          currentViewingIndex++;
          renderCurrentStoryItem();
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (el.statusViewerModal && el.statusViewerModal.style.display !== 'none') {
        if (e.key === 'Escape') {
          closeStoryViewer();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          currentViewingIndex++;
          renderCurrentStoryItem();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentViewingIndex > 0) {
            currentViewingIndex--;
            renderCurrentStoryItem();
          }
        }
      }
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
      if (el.btnLoginSubmit) el.btnLoginSubmit.disabled = true;
      el.loginError.style.color = 'var(--accent-purple-light)';
      el.loginError.textContent = 'Authenticating with KYNX Cloud...';
      
      let res;
      try {
        res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username_or_email: identifier, password: password })
        });
      } catch (netErr) {
        throw new Error('Could not reach KYNX Cloud service. Server may be spinning up from sleep. Please wait 10 seconds and tap Connect again.');
      }

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}). Cloud database or backend service is undergoing maintenance.`);
        }
      }
      el.loginError.style.color = 'var(--accent-red)';
      
      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || `Login failed (${res.status}). Please check credentials.`);
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
      let msg = err.message || 'Login failed.';
      if (msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Cloud server unreachable. Server may be waking up from sleep. Please retry in 10 seconds.';
      }
      el.loginError.textContent = msg;
    } finally {
      if (el.btnLoginSubmit) el.btnLoginSubmit.disabled = false;
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
      
      let res;
      try {
        res = await fetch(`${BACKEND_URL}/api/auth/login/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ temp_token: AppState.tempToken, otp: otp })
        });
      } catch (netErr) {
        throw new Error('Could not reach KYNX Cloud service.');
      }
      
      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}).`);
        }
      }
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

  // --- Password Reset Handlers ---
  async function handleSendResetOtp() {
    const identifier = el.forgotIdentifier ? el.forgotIdentifier.value.trim() : '';
    if (!identifier) {
      if (el.forgotReqError) {
        el.forgotReqError.style.color = 'var(--accent-red)';
        el.forgotReqError.textContent = 'Please enter your username or registered email.';
      }
      return;
    }

    try {
      if (el.btnSendResetOtp) el.btnSendResetOtp.disabled = true;
      if (el.forgotReqError) {
        el.forgotReqError.style.color = 'var(--accent-purple-light)';
        el.forgotReqError.textContent = 'Contacting KYNX security cloud...';
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_username: identifier })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Could not send reset code. Please verify username/email.');
      }

      AppState.resetEmail = data.email || identifier;
      AppState.resetIdentifier = identifier;

      if (el.forgotReqError) el.forgotReqError.textContent = '';
      if (el.forgotReqSection) el.forgotReqSection.style.display = 'none';
      if (el.forgotConfirmSection) {
        el.forgotConfirmSection.style.display = 'block';
        if (el.forgotConfirmMasked) {
          el.forgotConfirmMasked.textContent = `A 6-digit recovery code was dispatched to ${data.masked_email || data.email || 'your email'}.`;
        }
        if (el.forgotOtp) {
          el.forgotOtp.value = '';
          el.forgotOtp.focus();
        }
        if (el.forgotConfirmError) el.forgotConfirmError.textContent = '';
      }
    } catch (err) {
      if (el.forgotReqError) {
        el.forgotReqError.style.color = 'var(--accent-red)';
        let msg = err.message || 'Failed to dispatch recovery code.';
        if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('load failed')) {
          msg = 'Cloud server unreachable. Please wait 10 seconds and retry.';
        }
        el.forgotReqError.textContent = msg;
      }
    } finally {
      if (el.btnSendResetOtp) el.btnSendResetOtp.disabled = false;
    }
  }

  async function handleResendResetOtp() {
    const identifier = AppState.resetIdentifier || (el.forgotIdentifier ? el.forgotIdentifier.value.trim() : '');
    if (!identifier) return;

    try {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-purple-light)';
        el.forgotConfirmError.textContent = 'Resending recovery code...';
      }
      const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_username: identifier })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Could not resend recovery code.');

      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-green)';
        el.forgotConfirmError.textContent = 'Fresh recovery code dispatched to your email!';
      }
    } catch (err) {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-red)';
        el.forgotConfirmError.textContent = err.message || 'Resend failed.';
      }
    }
  }

  async function handleConfirmResetPwd() {
    const code = el.forgotOtp ? el.forgotOtp.value.trim() : '';
    const newPwd = el.forgotNewPwd ? el.forgotNewPwd.value.trim() : '';
    const confirmPwd = el.forgotConfirmPwd ? el.forgotConfirmPwd.value.trim() : '';
    const email = AppState.resetEmail || (el.forgotIdentifier ? el.forgotIdentifier.value.trim() : '');

    if (!code || code.length !== 6) {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-red)';
        el.forgotConfirmError.textContent = 'Please enter the 6-digit recovery code from your email.';
      }
      return;
    }
    if (!newPwd || newPwd.length < 8) {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-red)';
        el.forgotConfirmError.textContent = 'New password must be at least 8 characters long.';
      }
      return;
    }
    if (newPwd !== confirmPwd) {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-red)';
        el.forgotConfirmError.textContent = 'Passwords do not match. Please re-enter.';
      }
      return;
    }

    try {
      if (el.btnVerifyResetPwd) el.btnVerifyResetPwd.disabled = true;
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-purple-light)';
        el.forgotConfirmError.textContent = 'Updating password securely...';
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          code: code,
          new_password: newPwd,
          confirm_new_password: confirmPwd
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Password update failed. Check the code and try again.');
      }

      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-green)';
        el.forgotConfirmError.textContent = 'Password reset successfully! Connecting session...';
      }

      // Pre-fill login form with new credentials and auto-login
      if (el.loginIdentifier) el.loginIdentifier.value = AppState.resetIdentifier || email;
      if (el.loginPassword) el.loginPassword.value = newPwd;

      setTimeout(async () => {
        if (el.forgotConfirmSection) el.forgotConfirmSection.style.display = 'none';
        if (el.loginForm) el.loginForm.style.display = 'block';
        await handleDirectLogin();
      }, 1000);
    } catch (err) {
      if (el.forgotConfirmError) {
        el.forgotConfirmError.style.color = 'var(--accent-red)';
        el.forgotConfirmError.textContent = err.message || 'Failed to update password.';
      }
    } finally {
      if (el.btnVerifyResetPwd) el.btnVerifyResetPwd.disabled = false;
    }
  }

  async function logout(promptConfirm = true) {
    if (promptConfirm && !confirm('Disconnect and log out from KYNX Web Deck?')) {
      return;
    }

    const currentToken = AppState.token;
    const currentWs = AppState.ws;

    // 1. Notify Backend via WS & REST
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      try {
        currentWs.send(JSON.stringify({ type: 'web_deck_logout', ts: Date.now() }));
      } catch (_) {}
    }
    if (currentToken) {
      try {
        fetch(`${BACKEND_URL}/api/auth/pair/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        }).catch(() => {});
      } catch (_) {}
    }

    // 2. Clear all local storage & session state
    try {
      localStorage.removeItem('kynx_web_token');
      localStorage.removeItem('kynx_web_user');
      sessionStorage.clear();
    } catch (_) {}

    // 3. Reset AppState
    AppState.token = null;
    AppState.user = null;
    AppState.conversations = [];
    AppState.activeConversation = null;

    // 4. Clear all polling timers & call state
    if (conversationsPollTimer) { clearInterval(conversationsPollTimer); conversationsPollTimer = null; }
    if (activeSyncTimer) { clearInterval(activeSyncTimer); activeSyncTimer = null; }
    stopWsHeartbeat();
    if (typeof CallManager !== 'undefined' && CallManager && typeof CallManager.reset === 'function') {
      CallManager.reset();
    }

    // 5. Close WebSocket gracefully
    if (currentWs) {
      try {
        currentWs.close(1000, 'User Logout');
      } catch (_) {}
      AppState.ws = null;
      AppState.wsConnected = false;
    }

    // 6. Reset UI seamlessly without harsh crash
    if (el.profileModal) el.profileModal.style.display = 'none';
    if (el.webApp) {
      el.webApp.classList.remove('mobile-chat-open');
    }
    if (el.activeChatView) el.activeChatView.style.display = 'none';
    if (el.emptyState) el.emptyState.style.display = 'flex';
    if (el.conversationsList) el.conversationsList.innerHTML = '';

    showAuth();
    showHeadsUpCard('Session Disconnected', 'Logged out from KYNX Web Deck.');
    startPairingFlow();
  }

  // ==========================================================================
  // DESKTOP WORKSPACE & CHAT
  // ==========================================================================

  let conversationsPollTimer = null;
  let activeSyncTimer = null;

  async function showDeck() {
    hideAuth();

    // 0ms Instant Load: Render cached conversations immediately on screen!
    if (AppState.conversations && AppState.conversations.length > 0 && AppState.activeTab === 'chats') {
      renderConversations();
    }

    function syncSidebarProfile(userObj) {
      const u = userObj || AppState.user || {};
      const name = u.displayName || u.display_name || u.username || 'KYNX User';
      const handle = u.username || 'kynx_user';
      const inits = (u.displayName || u.display_name || u.username || 'KG').substring(0, 2).toUpperCase();
      const photo = u.profile_photo_url || u.photo_url || u.avatar_url;
      if (el.userAvatar) {
        if (photo) {
          el.userAvatar.innerHTML = `<span class="online-dot-indicator"></span>`;
          el.userAvatar.style.backgroundImage = `url('${resolveMediaUrl(photo)}')`;
          el.userAvatar.style.backgroundSize = 'cover';
          el.userAvatar.style.backgroundPosition = 'center';
        } else {
          el.userAvatar.innerHTML = `${inits}<span class="online-dot-indicator"></span>`;
          el.userAvatar.style.backgroundImage = 'none';
        }
      }
      if (el.userName) el.userName.textContent = name;
      if (el.userHandle) el.userHandle.textContent = '@' + handle;
    }

    // Verify / refresh user profile in background (non-blocking)
    if (!AppState.user || !AppState.user.id) {
      fetch(`${BACKEND_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      }).then(res => res.ok ? res.json() : null).then(u => {
        if (u) {
          AppState.user = u;
          try { localStorage.setItem('kynx_web_user', JSON.stringify(u)); } catch (_) {}
          syncSidebarProfile(u);
        }
      }).catch(e => console.warn('Could not refresh profile:', e));
    }

    // Update user profile in sidebar immediately from cache
    syncSidebarProfile(AppState.user);

    // Notifications status check
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

    // Fetch Conversations & Friend Requests & Updates Badge
    loadConversations();
    checkPendingRequestsBadge();
    checkUpdatesBadge();

    // Smart adaptive conversation refresh (pauses while tab hidden; relaxes when WS is live)
    if (conversationsPollTimer) clearInterval(conversationsPollTimer);
    conversationsPollTimer = setInterval(() => {
      if (document.hidden) return;
      loadConversations();
      checkPendingRequestsBadge();
      checkUpdatesBadge();
    }, 20000);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && AppState.token) {
      loadConversations();
      checkPendingRequestsBadge();
      checkUpdatesBadge();
      if (AppState.activeConversation) syncActiveConversation();
    }
  });

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
    } else if (msg.type === 'friend_request_received') {
      playNotificationSound();
      checkPendingRequestsBadge();
      const sender = msg.sender || {};
      const senderName = sender.display_name || sender.username || 'A KYNX User';
      showFriendRequestHeadsUp(msg.request_id, senderName, sender.username);
      if (AppState.activeTab === 'contacts') {
        loadAndRenderContacts();
      }
    } else if (msg.type === 'friend_request_accepted') {
      playNotificationSound();
      checkPendingRequestsBadge();
      const friend = msg.friend || {};
      const friendName = friend.display_name || friend.username || 'A friend';
      showHeadsUpCard('Friend Request Accepted', `${friendName} is now in your circle!`);
      loadConversations();
      if (AppState.activeTab === 'contacts') {
        loadAndRenderContacts();
      }
    } else if (msg.type === 'friend_removed') {
      checkPendingRequestsBadge();
      loadConversations();
      if (AppState.activeTab === 'contacts') {
        loadAndRenderContacts();
      }
    } else if (msg.type === 'web_deck_terminated') {
      showHeadsUpCard('Session Terminated', 'Disconnected from KYNX Mobile App.');
      logout(false);
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
        try {
          localStorage.setItem('kynx_cached_conversations', JSON.stringify(AppState.conversations));
        } catch (_) {}
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
      const rawLastMsg = conv.last_message?.text || conv.lastMessage?.text || conv.snippet || 'Tap to open chat';
      const lastMsg = formatPowerPreview(rawLastMsg) || 'Tap to open chat';
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
    PowerState.chatHistorySeeded = false;
    PowerState.seenPttIds.clear();
    PowerState.lastWatchMsgId = null;
    applyWatchCommandLocally({ action: 'close' });
    setWalkieTalkieMode(false);
    if (AppState.activeTab === 'chats') {
      renderConversations();
      if (AppState.searchQuery) filterConversations(AppState.searchQuery);
    }

    el.emptyState.style.display = 'none';
    el.activeChatView.style.display = 'flex';
    if (openMobilePanel && el.webApp) {
      el.webApp.classList.add('mobile-chat-open');
      if (window.innerWidth <= 820 && (!history.state || !history.state.kynxChatOpen)) {
        try {
          history.pushState({ kynxChatOpen: true }, '');
        } catch (_) {}
      }
    }

    const peer = conv.peer || {};
    const title = peer.display_name || peer.username || conv.title || conv.displayName || 'Encrypted Peer';
    el.peerAvatar.textContent = title.substring(0, 2).toUpperCase();
    el.peerName.textContent = title;
    el.peerStatus.innerHTML = peer.is_online ? `● online` : `<span style="color:var(--text-sub)">● offline</span>`;
    if (el.menuTextBlock) {
      el.menuTextBlock.textContent = peer.is_blocked ? 'Unblock User' : 'Block User';
    }

    const convId = conv.id;
    const cachedMsgs = getCachedMessages(convId);
    if (cachedMsgs.length > 0) {
      el.messagesCanvas.innerHTML = `
        <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
          🔒 Hardware Encrypted Peer Session (Render + WebRTC)
        </div>`;
      cachedMsgs.forEach(m => appendMessageToUI(m));
      scrollChatToBottom();
      PowerState.chatHistorySeeded = true;
    } else {
      el.messagesCanvas.innerHTML = `
        <div style="text-align: center; color: var(--text-sub); font-size: 12px; margin: 20px 0;">
          🔒 Hardware Encrypted Peer Session (Render + WebRTC)
        </div>
        <div class="chat-sync-placeholder" style="text-align: center; color: var(--text-muted); font-size: 12px; padding: 24px;">
          <div style="display:inline-block; width:14px; height:14px; border:2px solid var(--accent-purple); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; margin-right:8px; vertical-align:middle;"></div>
          Syncing messages...
        </div>`;
    }

    // Fetch initial message history in background (0ms UI latency)
    syncActiveConversation();

    // Adaptive fallback sync: WS delivers in <50ms, so only poll every 15s while WS is live (4s if WS drops)
    if (activeSyncTimer) clearInterval(activeSyncTimer);
    let pollTick = 0;
    activeSyncTimer = setInterval(() => {
      if (document.hidden || !AppState.activeConversation) return;
      pollTick++;
      if (!AppState.wsConnected || pollTick % 4 === 0) {
        syncActiveConversation();
      }
    }, 4000);
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
        const wasSeeded = PowerState.chatHistorySeeded;
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
            if (wasSeeded) {
              const txt = m.text || m.content || '';
              const wCmd = parseWatchMessage(txt);
              if (wCmd && m.id !== PowerState.lastWatchMsgId) {
                PowerState.lastWatchMsgId = m.id;
                applyWatchCommandLocally(wCmd);
              }
              if (!isMine && isPttMessage(txt, m.media_type || m.mediaType) && !PowerState.seenPttIds.has(m.id)) {
                PowerState.seenPttIds.add(m.id);
                const mUrl = resolveMediaUrl(m.media_url || m.mediaUrl);
                if (mUrl) playPttAudioUrl(mUrl, true);
              }
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
          if (!wasSeeded) {
            const txt = m.text || m.content || '';
            if (isPttMessage(txt, m.media_type || m.mediaType) && m.id) PowerState.seenPttIds.add(m.id);
            if (parseWatchMessage(txt) && m.id) PowerState.lastWatchMsgId = m.id;
          }
          const rendered = appendMessageToUI(m);
          if (rendered) shouldScroll = true;
        });
        const placeholder = el.messagesCanvas.querySelector('.chat-sync-placeholder');
        if (placeholder) placeholder.remove();
        PowerState.chatHistorySeeded = true;
        saveCachedMessages(convId, AppState.messages[convId]);

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
    const rawTyped = el.msgInput.value.trim();
    if (!rawTyped || !AppState.activeConversation) return;
    const text = PowerState.burnSeconds > 0
      ? `[[KYNX_BURN:${PowerState.burnSeconds}]]${rawTyped}`
      : rawTyped;
    if (PowerState.burnSeconds > 0) {
      PowerState.burnSeconds = 0;
      updateBurnTimerButton();
    }

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
    saveCachedMessages(AppState.activeConversation.id, AppState.messages[AppState.activeConversation.id]);
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
      saveCachedMessages(convId, AppState.messages[convId]);
    }

    if (AppState.activeConversation && AppState.activeConversation.id === convId) {
      const rendered = appendMessageToUI(msg);
      if (rendered) scrollChatToBottom();

      // Live Watch Together sync & Walkie-Talkie instant auto-play
      const txt = msg.text || msg.content || '';
      const wCmd = parseWatchMessage(txt);
      if (wCmd && msg.id !== PowerState.lastWatchMsgId) {
        PowerState.lastWatchMsgId = msg.id;
        applyWatchCommandLocally(wCmd);
      }
      const myIdNow = AppState.user ? (AppState.user.id || AppState.user.userId) : null;
      const senderNow = msg.sender_id || msg.senderId;
      const isMineNow = (myIdNow && senderNow === myIdNow) || msg.isMine;
      if (!isMineNow && isPttMessage(txt, msg.media_type || msg.mediaType) && !PowerState.seenPttIds.has(msg.id)) {
        PowerState.seenPttIds.add(msg.id);
        const mUrl = resolveMediaUrl(msg.media_url || msg.mediaUrl);
        if (mUrl) playPttAudioUrl(mUrl, true);
      }
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
    const safePreview = formatPowerPreview(previewText || '') || '';
    AppState.replyTo = { id: msgId, sender: senderName, text: safePreview.slice(0, 120) };
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
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/aac')) mimeType = 'audio/aac';
      }
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

        const blobType = voiceRecorder.mimeType || (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');
        const blob = new Blob(voiceChunks, { type: blobType });
        let ext = 'webm';
        if ((blob.type || '').includes('mp4') || (blob.type || '').includes('aac')) ext = 'm4a';
        else if ((blob.type || '').includes('ogg')) ext = 'ogg';
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

    const replyToText = formatPowerPreview(msg.reply_to_text || msg.replyToText);
    const replyToSender = msg.reply_to_sender || msg.replyToSender || 'Message';
    const quotedHtml = replyToText
      ? `<div class="msg-quoted-reply"><div class="msg-quoted-sender">${escapeHtml(replyToSender)}</div><div class="msg-quoted-text">${escapeHtml(replyToText)}</div></div>`
      : '';

    const watchCmd = !isDeleted ? parseWatchMessage(rawText) : null;
    const burnPayload = (!isDeleted && !watchCmd) ? parseBurnMessage(rawText) : null;
    const isPttMsg = !isDeleted && isPttMessage(rawText, mediaType);
    const isAlreadyBurned = Boolean(burnPayload && msgId && getBurnedIdsSet().has(String(msgId)));

    let bodyHtml = '';
    if (isDeleted) {
      bodyHtml = `<div class="msg-deleted-text">🚫 This message was deleted</div>`;
    } else if (watchCmd) {
      const lbl = watchCmd.action === 'play'
        ? `🎵 Watch Together · Playing (${formatWatchSec(watchCmd.timeSec)})`
        : watchCmd.action === 'pause'
          ? `⏸ Watch Together · Paused (${formatWatchSec(watchCmd.timeSec)})`
          : watchCmd.action === 'seek'
            ? `⏩ Watch Together · Synced to ${formatWatchSec(watchCmd.timeSec)}`
            : '⏹ Watch Together · Room ended';
      bodyHtml = `${quotedHtml}<div class="watch-msg-pill" data-watch-pill="1">${escapeHtml(lbl)}</div>`;
    } else if (isPttMsg) {
      bodyHtml = `${quotedHtml}
        <div class="ptt-msg-card" data-ptt-play="1">
          <div class="ptt-play-circle">🔊</div>
          <div>
            <div class="ptt-msg-title">📻 Walkie-Talkie Burst</div>
            <div class="ptt-msg-sub">${mediaUrl ? 'Click to replay instant voice' : 'Offline Mesh Voice Burst'}</div>
          </div>
        </div>`;
    } else if (burnPayload) {
      if (isAlreadyBurned) {
        bodyHtml = `${quotedHtml}<div class="burn-erased-pill">💨 Burned &amp; Erased</div>`;
      } else {
        const secLbl = burnPayload.seconds === 60 ? '1m' : `${burnPayload.seconds}s`;
        bodyHtml = `${quotedHtml}
          <div class="burn-card" data-burn-reveal="1">
            <span style="font-size:20px;">🔥</span>
            <div>
              <div class="burn-card-title">${isMine ? `Burn Message (${secLbl})` : 'Secret Burn Message'}</div>
              <div class="burn-card-sub">Click to reveal • Self-destructs in ${secLbl}</div>
            </div>
          </div>`;
      }
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
    const canEdit = isMine && !mediaUrl && !isViewOnce && !watchCmd && !burnPayload && !isPttMsg;
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
        wrapper.classList.remove('show-actions');
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

    // Wire interactive Build 56 Power Feature cards (Watch pill, PTT replay, Burn countdown)
    const watchPillEl = wrapper.querySelector('[data-watch-pill]');
    if (watchPillEl && watchCmd) {
      watchPillEl.addEventListener('click', () => {
        if (watchCmd.action !== 'close' && watchCmd.videoId) {
          applyWatchCommandLocally({ ...watchCmd, action: 'play', ts: Date.now() });
        } else if (el.watchDrawer) {
          el.watchDrawer.style.display = 'block';
        }
      });
    }

    const pttPlayEl = wrapper.querySelector('[data-ptt-play]');
    if (pttPlayEl && mediaUrl) {
      pttPlayEl.addEventListener('click', () => playPttAudioUrl(mediaUrl, true));
    }

    const burnCardEl = wrapper.querySelector('[data-burn-reveal]');
    if (burnCardEl && burnPayload) {
      burnCardEl.addEventListener('click', () => {
        const bodySlot = wrapper.querySelector('.msg-body-slot');
        if (!bodySlot) return;
        const total = burnPayload.seconds;
        let rem = total;
        bodySlot.innerHTML = `${quotedHtml}
          <div class="burn-revealed-box">
            <div class="burn-countdown-label">🔥 BURNING IN <span class="burn-rem">${rem}</span>s</div>
            <div class="burn-secret-text">${escapeHtml(burnPayload.body)}</div>
            <div class="burn-progress-track"><div class="burn-progress-fill" style="width:100%"></div></div>
          </div>`;
        const remSpan = bodySlot.querySelector('.burn-rem');
        const fillEl = bodySlot.querySelector('.burn-progress-fill');
        const timer = setInterval(async () => {
          rem--;
          if (rem > 0) {
            if (remSpan) remSpan.textContent = String(rem);
            if (fillEl) fillEl.style.width = `${Math.max(0, (rem / total) * 100)}%`;
            return;
          }
          clearInterval(timer);
          const currentId = wrapper.getAttribute('data-msg-id');
          markBurnedId(currentId);
          bodySlot.innerHTML = `${quotedHtml}<div class="burn-erased-pill">💨 Burned &amp; Erased</div>`;
          if (currentId && AppState.token && !String(currentId).startsWith('kynx_msg_')) {
            try {
              if (isMine) {
                await fetch(`${BACKEND_URL}/api/messages/${currentId}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${AppState.token}` }
                });
              } else {
                await fetch(`${BACKEND_URL}/api/messages/${currentId}/hide`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${AppState.token}` }
                });
              }
            } catch (_) {}
          }
        }, 1000);
      });
    }

    // Double-tap & Tap-and-Hold (Long Press) for emoji reaction bar
    // Single-tap / Click for Ghost Shield unblur toggle without emojis
    let lastTapTime = 0;
    let singleTapTimer = null;
    let longPressTimer = null;
    let isLongPressTriggered = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchHandled = false;

    function openActionsPopup() {
      window.__lastActionsOpenTime = Date.now();
      document.querySelectorAll('.msg-bubble-wrapper.show-actions').forEach(m => {
        if (m !== wrapper) m.classList.remove('show-actions');
      });
      wrapper.classList.add('show-actions');
      try { if (navigator.vibrate) navigator.vibrate(40); } catch (_) {}
    }

    // Desktop double-click
    wrapper.addEventListener('dblclick', (e) => {
      if (e.target.closest('.msg-act-btn') || e.target.closest('a') || e.target.closest('button') || e.target.closest('[data-ptt-play]') || e.target.closest('[data-burn-reveal]')) return;
      e.preventDefault();
      openActionsPopup();
    });

    // Touch handling: Long Press + Double Tap + Single Tap Ghost unblur
    wrapper.addEventListener('touchstart', (e) => {
      touchHandled = true;
      if (e.target.closest('.msg-act-btn') || e.target.closest('a') || e.target.closest('button') || e.target.closest('[data-ptt-play]') || e.target.closest('[data-burn-reveal]')) return;

      isLongPressTriggered = false;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;

      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        isLongPressTriggered = true;
        clearTimeout(singleTapTimer);
        lastTapTime = 0;
        openActionsPopup();
      }, 380);
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (longPressTimer && e.touches && e.touches[0]) {
        const t = e.touches[0];
        if (Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10) {
          clearTimeout(longPressTimer);
        }
      }
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      clearTimeout(longPressTimer);
      if (isLongPressTriggered) {
        isLongPressTriggered = false;
        e.preventDefault();
        return;
      }

      if (e.target.closest('.msg-act-btn') || e.target.closest('a') || e.target.closest('button') || e.target.closest('[data-ptt-play]') || e.target.closest('[data-burn-reveal]')) return;

      const now = Date.now();
      const diff = now - lastTapTime;

      if (diff < 350 && diff > 40) {
        clearTimeout(singleTapTimer);
        lastTapTime = 0;
        e.preventDefault();
        openActionsPopup();
      } else {
        lastTapTime = now;
        singleTapTimer = setTimeout(() => {
          if (AppState.ghostShield) {
            wrapper.classList.toggle('ghost-revealed');
          }
        }, 280);
      }
    });

    wrapper.addEventListener('touchcancel', () => {
      clearTimeout(longPressTimer);
      clearTimeout(singleTapTimer);
      isLongPressTriggered = false;
    });

    wrapper.addEventListener('click', (e) => {
      if (touchHandled) { touchHandled = false; return; }
      if (e.target.closest('.msg-act-btn') || e.target.closest('a') || e.target.closest('button') || e.target.closest('[data-ptt-play]') || e.target.closest('[data-burn-reveal]')) return;
      if (AppState.ghostShield) {
        wrapper.classList.toggle('ghost-revealed');
      }
    });

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
      if (el.btnGhostShield) {
        el.btnGhostShield.classList.add('active');
        el.btnGhostShield.innerHTML = `🛡️ Ghost Shield [ON]`;
      }
    } else {
      document.body.classList.remove('ghost-shield-active');
      if (el.btnGhostShield) {
        el.btnGhostShield.classList.remove('active');
        el.btnGhostShield.innerHTML = `🛡️ Ghost Shield`;
      }
      document.querySelectorAll('.msg-bubble-wrapper.ghost-revealed').forEach(el => el.classList.remove('ghost-revealed'));
      document.querySelectorAll('.msg-bubble-wrapper.show-actions').forEach(el => el.classList.remove('show-actions'));
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

  // ==========================================================================
  // FRIEND & CONTACT REQUESTS ENGINE (KYNX Web Deck)
  // ==========================================================================

  async function checkPendingRequestsBadge() {
    if (!AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/requests`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      const incoming = Array.isArray(data.incoming) ? data.incoming : [];
      AppState.pendingRequestsCount = incoming.length;
      if (el.contactsBadge) {
        if (incoming.length > 0) {
          el.contactsBadge.style.display = 'inline-flex';
          el.contactsBadge.textContent = incoming.length;
        } else {
          el.contactsBadge.style.display = 'none';
        }
      }
    } catch (e) {
      // quiet fail
    }
  }

  async function acceptFriendRequest(requestId, senderName) {
    if (!AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) {
        alert('Could not accept friend request. It may have expired or already been handled.');
        return;
      }
      playNotificationSound();
      showHeadsUpCard('Friend Request Accepted', `You and ${senderName || 'peer'} are now connected!`);
      await checkPendingRequestsBadge();
      await loadConversations();
      if (AppState.activeTab === 'contacts') {
        await loadAndRenderContacts();
      }
    } catch (e) {
      console.warn('Error accepting friend request:', e);
    }
  }

  async function rejectFriendRequest(requestId) {
    if (!AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) return;
      await checkPendingRequestsBadge();
      if (AppState.activeTab === 'contacts') {
        await loadAndRenderContacts();
      }
    } catch (e) {
      console.warn('Error rejecting friend request:', e);
    }
  }

  async function cancelSentFriendRequest(requestId) {
    if (!AppState.token) return;
    try {
      await fetch(`${BACKEND_URL}/api/friends/requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (AppState.activeTab === 'contacts') {
        await loadAndRenderContacts();
      }
    } catch (e) {
      console.warn('Error canceling sent request:', e);
    }
  }

  async function sendFriendRequest(targetUserId, btn) {
    if (!AppState.token) return;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending...';
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AppState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: targetUserId })
      });
      if (res.ok) {
        if (btn) {
          btn.textContent = '✓ Sent';
          btn.style.background = 'rgba(32, 201, 151, 0.2)';
          btn.style.color = '#20C997';
          btn.style.borderColor = '#20C997';
        }
        showHeadsUpCard('Friend Request Sent', 'Waiting for peer to accept.');
        if (AppState.activeTab === 'contacts') {
          setTimeout(loadAndRenderContacts, 600);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || 'Could not send request.');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '+ Add Friend';
        }
      }
    } catch (e) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '+ Add Friend';
      }
    }
  }

  function showFriendRequestHeadsUp(requestId, senderName, senderUsername) {
    const container = document.getElementById('kynx-heads-up-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'kynx-heads-up-card';
    const initials = (senderName || 'KYNX').substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="heads-up-avatar" style="background:var(--avatar-gradient); color:var(--avatar-color); border:1px solid var(--avatar-border);">${escapeHtml(initials)}</div>
      <div class="heads-up-body">
        <div class="heads-up-top">
          <span class="heads-up-name">Friend Request</span>
          <span class="heads-up-time">Just now</span>
        </div>
        <div class="heads-up-text"><strong>${escapeHtml(senderName)}</strong> (@${escapeHtml(senderUsername || '')}) wants to connect.</div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn-heads-up-accept" style="background:var(--accent-purple); color:#fff; border:none; border-radius:6px; padding:5px 12px; font-size:11.5px; font-weight:700; cursor:pointer;">✓ Accept</button>
          <button class="btn-heads-up-decline" style="background:rgba(255,255,255,0.1); color:#fff; border:none; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Decline</button>
        </div>
      </div>
      <button class="heads-up-close" title="Dismiss">✕</button>
    `;

    const btnAccept = card.querySelector('.btn-heads-up-accept');
    if (btnAccept) {
      btnAccept.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        acceptFriendRequest(requestId, senderName);
      });
    }

    const btnDecline = card.querySelector('.btn-heads-up-decline');
    if (btnDecline) {
      btnDecline.addEventListener('click', (e) => {
        e.stopPropagation();
        card.remove();
        rejectFriendRequest(requestId);
      });
    }

    const btnClose = card.querySelector('.heads-up-close');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.add('hiding');
        setTimeout(() => card.remove(), 200);
      });
    }

    container.appendChild(card);
    setTimeout(() => {
      if (card.parentNode) {
        card.classList.add('hiding');
        setTimeout(() => card.remove(), 200);
      }
    }, 18000);
  }

  // Remove Contact / Unfriend from Circle
  async function removeContact(userId, displayName) {
    if (!AppState.token) return;
    const confirmed = confirm(`Remove "${displayName || 'this contact'}" from your circle?\n\nThey will be removed from your contacts, and you won't be able to chat until a new friend request is sent and accepted.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/friends/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || 'Could not remove contact.');
        return;
      }

      showHeadsUpCard('Removed from Circle', `${displayName || 'User'} has been removed from your contacts.`);

      // If active conversation is with this peer, close active chat
      if (AppState.activeConversation && getPeerId(AppState.activeConversation) === userId) {
        AppState.activeConversation = null;
        if (el.activeChatView) el.activeChatView.style.display = 'none';
        if (el.emptyState) el.emptyState.style.display = 'flex';
      }

      // Close profile modal if open
      if (el.profileModal) el.profileModal.style.display = 'none';

      await loadConversations();
      if (AppState.activeTab === 'contacts') {
        await loadAndRenderContacts();
      }
    } catch (e) {
      console.warn('Error removing contact:', e);
      alert('Error removing contact. Please check your network.');
    }
  }

  // Block / Unblock User
  async function toggleBlockUser(userId, displayName, isCurrentlyBlocked) {
    if (!AppState.token) return;
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    const confirmed = confirm(isCurrentlyBlocked 
      ? `Unblock "${displayName || 'this user'}"? They will be able to message you again.`
      : `Block "${displayName || 'this user'}"? They will not be able to send you messages or call you.`
    );
    if (!confirmed) return;

    try {
      const method = isCurrentlyBlocked ? 'DELETE' : 'POST';
      const res = await fetch(`${BACKEND_URL}/api/blocks/${userId}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || `Could not ${action} user.`);
        return;
      }

      showHeadsUpCard(isCurrentlyBlocked ? 'User Unblocked' : 'User Blocked', `${displayName || 'User'} is now ${isCurrentlyBlocked ? 'unblocked' : 'blocked'}.`);

      if (el.profileModal) el.profileModal.style.display = 'none';
      if (el.chatMoreMenu) el.chatMoreMenu.style.display = 'none';

      await loadConversations();
      if (AppState.activeTab === 'contacts') {
        await loadAndRenderContacts();
      }
    } catch (e) {
      console.warn('Error toggling block status:', e);
      alert(`Error trying to ${action} user.`);
    }
  }

  // Open User Profile & Bio Modal (Peer or Self)
  let currentProfileTarget = null;
  async function openUserProfileModal(userId, isSelf = false) {
    if (!el.profileModal) return;

    el.profileModal.style.display = 'flex';
    el.profileModalTitle.textContent = isSelf ? 'My Profile & Status' : 'User Profile';
    el.profileModalDisplayName.textContent = 'Loading...';
    el.profileModalHandle.textContent = '';
    el.profileModalStatusText.textContent = '';
    el.profileModalBio.textContent = '...';
    el.profileModalVerified.style.display = 'none';
    el.profileSelfEditWrap.style.display = 'none';
    el.profilePeerActions.style.display = 'none';

    try {
      let userData = null;
      if (isSelf) {
        const meRes = await fetch(`${BACKEND_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        });
        userData = meRes.ok ? await meRes.json() : AppState.user;
      } else {
        const uRes = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        });
        if (uRes.ok) {
          userData = await uRes.json();
        } else if (AppState.activeConversation && AppState.activeConversation.peer) {
          userData = AppState.activeConversation.peer;
        }
      }

      if (!userData) {
        el.profileModal.style.display = 'none';
        return;
      }

      currentProfileTarget = userData;
      const name = userData.display_name || userData.displayName || userData.username || 'KYNX User';
      const handle = userData.username ? `@${userData.username}` : '';
      const bio = userData.status_message || userData.bio || (isSelf ? 'Available on KYNX Web' : 'Connected on KYNX');
      const initials = name.substring(0, 2).toUpperCase();
      const isOnline = Boolean(userData.is_online);
      const isVerified = Boolean(userData.is_email_verified);
      const isBlocked = Boolean(userData.is_blocked);

      const photo = userData.profile_photo_url || userData.photo_url || userData.avatar_url;
      if (photo) {
        el.profileModalAvatar.textContent = '';
        el.profileModalAvatar.style.backgroundImage = `url('${resolveMediaUrl(photo)}')`;
        el.profileModalAvatar.style.backgroundSize = 'cover';
        el.profileModalAvatar.style.backgroundPosition = 'center';
      } else {
        el.profileModalAvatar.style.backgroundImage = 'none';
        el.profileModalAvatar.textContent = initials;
      }
      el.profileModalDisplayName.textContent = name;
      el.profileModalHandle.textContent = handle;
      el.profileModalBio.textContent = bio;
      el.profileModalVerified.style.display = isVerified ? 'inline-flex' : 'none';
      el.profileModalOnlineDot.style.background = isOnline ? '#10B981' : '#6B7280';
      el.profileModalStatusText.textContent = isOnline ? '● Online' : '○ Offline';

      if (isSelf) {
        el.profileSelfEditWrap.style.display = 'flex';
        el.profileEditNameInput.value = name;
        el.profileEditBioInput.value = userData.status_message || '';
      } else {
        el.profilePeerActions.style.display = 'flex';
        if (el.btnProfileBlockUser) {
          el.btnProfileBlockUser.textContent = isBlocked ? '✓ Unblock User' : '🛑 Block User';
        }
      }
    } catch (e) {
      console.warn('Error fetching user profile:', e);
    }
  }

  // Save Self Profile (Display Name & Bio)
  async function saveSelfProfile() {
    if (!AppState.token) return;
    const newName = el.profileEditNameInput.value.trim();
    const newBio = el.profileEditBioInput.value.trim();

    if (!newName) {
      alert('Display Name cannot be empty.');
      return;
    }

    el.btnSaveSelfProfile.disabled = true;
    el.btnSaveSelfProfile.textContent = 'Saving...';

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AppState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          display_name: newName,
          status_message: newBio
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Could not update profile.');
        el.btnSaveSelfProfile.disabled = false;
        el.btnSaveSelfProfile.textContent = 'Save Changes ⚡';
        return;
      }

      const updated = await res.json();
      if (AppState.user) {
        AppState.user.display_name = updated.display_name;
        AppState.user.displayName = updated.display_name;
        AppState.user.status_message = updated.status_message;
      }

      if (el.userName) el.userName.textContent = updated.display_name;
      if (el.userAvatar) el.userAvatar.textContent = updated.display_name.substring(0, 2).toUpperCase();

      showHeadsUpCard('Profile Updated', 'Your display name & status are now live.');
      if (el.profileModal) el.profileModal.style.display = 'none';
      if (AppState.activeTab === 'settings') loadAndRenderSettings();
    } catch (e) {
      console.warn('Error saving profile:', e);
      alert('Network error updating profile.');
    } finally {
      el.btnSaveSelfProfile.disabled = false;
      el.btnSaveSelfProfile.textContent = 'Save Changes ⚡';
    }
  }

  // Load and Render Contacts & Friend Requests in Sidebar
  async function loadAndRenderContacts() {
    if (!AppState.token) return;
    el.conversationsList.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
        <div class="typing-dots" style="margin-bottom: 12px; justify-content: center;">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        Loading Contacts & Requests...
      </div>`;

    try {
      const [contactsRes, requestsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/contacts`, {
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        }),
        fetch(`${BACKEND_URL}/api/friends/requests`, {
          headers: { 'Authorization': `Bearer ${AppState.token}` }
        })
      ]);

      const contacts = contactsRes.ok ? await contactsRes.json() : [];
      const requestsData = requestsRes.ok ? await requestsRes.json() : { incoming: [], sent: [] };
      const incoming = Array.isArray(requestsData.incoming) ? requestsData.incoming : [];
      const sent = Array.isArray(requestsData.sent) ? requestsData.sent : [];

      AppState.pendingRequestsCount = incoming.length;
      if (el.contactsBadge) {
        if (incoming.length > 0) {
          el.contactsBadge.style.display = 'inline-flex';
          el.contactsBadge.textContent = incoming.length;
        } else {
          el.contactsBadge.style.display = 'none';
        }
      }

      el.conversationsList.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'contacts-container';

      // 1. Search / Add Friend Bar
      const searchBox = document.createElement('div');
      searchBox.className = 'contact-search-box';
      searchBox.innerHTML = `
        <input type="text" id="contact-search-input" class="contact-search-input" placeholder="Search @username to add (+)..." />
        <button id="contact-search-btn" class="contact-search-btn">Search</button>
      `;
      container.appendChild(searchBox);

      const searchResultsBox = document.createElement('div');
      searchResultsBox.id = 'contact-search-results';
      searchResultsBox.style.display = 'none';
      searchResultsBox.style.marginBottom = '10px';
      container.appendChild(searchResultsBox);

      // Search Handler
      const searchInput = searchBox.querySelector('#contact-search-input');
      const searchBtn = searchBox.querySelector('#contact-search-btn');
      let searchTimeout = null;

      async function executeUserSearch() {
        const q = searchInput.value.trim();
        if (q.length < 2) {
          searchResultsBox.style.display = 'none';
          searchResultsBox.innerHTML = '';
          return;
        }
        searchResultsBox.style.display = 'block';
        searchResultsBox.innerHTML = `
          <div style="padding: 12px; text-align: center; color: var(--text-sub); font-size: 12px;">
            Searching users...
          </div>`;
        try {
          const sRes = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${AppState.token}` }
          });
          if (!sRes.ok) throw new Error('Search failed');
          const users = await sRes.json();
          searchResultsBox.innerHTML = '';
          if (!Array.isArray(users) || users.length === 0) {
            searchResultsBox.innerHTML = `
              <div style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 12px; background: var(--bg-card); border-radius: 10px;">
                No users found for "${escapeHtml(q)}"
              </div>`;
            return;
          }

          const header = document.createElement('div');
          header.className = 'contacts-section-header highlight';
          header.textContent = `SEARCH RESULTS (${users.length})`;
          searchResultsBox.appendChild(header);

          users.forEach(u => {
            if (u.id === AppState.user?.id) return; // skip self
            const card = document.createElement('div');
            card.className = 'chat-item-card';
            card.style.cursor = 'default';
            const name = u.display_name || u.username;
            const initials = name.substring(0, 2).toUpperCase();
            
            let actionBtnHtml = '';
            if (u.relationship_status === 'none') {
              actionBtnHtml = `<button class="btn-request-accept" style="padding:5px 12px; font-size:11.5px; flex:none;">+ Add Friend</button>`;
            } else if (u.relationship_status === 'pending_sent') {
              actionBtnHtml = `<span style="font-size:11px; color:var(--accent-amber); font-weight:600;">Pending Request</span>`;
            } else if (u.relationship_status === 'pending_received') {
              actionBtnHtml = `<button class="btn-request-accept" style="padding:5px 12px; font-size:11.5px; flex:none;">Accept</button>`;
            } else if (u.relationship_status === 'friends') {
              actionBtnHtml = `<button class="btn-request-accept" style="padding:5px 12px; font-size:11.5px; flex:none; background:rgba(121,80,255,0.2); border:1px solid var(--accent-purple);">Message</button>`;
            }

            card.innerHTML = `
              <div class="item-avatar">${initials}</div>
              <div class="item-info" style="flex:1">
                <div class="item-top">
                  <span class="item-title">${escapeHtml(name)}</span>
                  <span class="item-time">@${escapeHtml(u.username)}</span>
                </div>
                <div class="item-bottom">
                  <span class="item-preview">${escapeHtml(u.status_message || 'KYNX User')}</span>
                </div>
              </div>
              <div class="search-action-wrap">${actionBtnHtml}</div>
            `;

            const btn = card.querySelector('button');
            if (btn) {
              btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (u.relationship_status === 'none') {
                  await sendFriendRequest(u.id, btn);
                } else if (u.relationship_status === 'pending_received') {
                  const req = incoming.find(r => r.sender_id === u.id);
                  if (req) {
                    await acceptFriendRequest(req.request_id, name);
                  }
                } else if (u.relationship_status === 'friends') {
                  const existing = AppState.conversations.find(c => getPeerId(c) === u.id);
                  if (existing) openConversation(existing);
                }
              });
            }

            searchResultsBox.appendChild(card);
          });
        } catch (err) {
          searchResultsBox.innerHTML = `
            <div style="padding: 10px; color: var(--accent-red); font-size: 12px; text-align: center;">
              Search failed. Try again.
            </div>`;
        }
      }

      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(executeUserSearch, 350);
      });
      searchBtn.addEventListener('click', executeUserSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeUserSearch();
        }
      });

      // 2. Incoming Requests Section
      if (incoming.length > 0) {
        const incHeader = document.createElement('div');
        incHeader.className = 'contacts-section-header highlight';
        incHeader.innerHTML = `
          <span>⚡ INCOMING REQUESTS (${incoming.length})</span>
          <span style="font-size:10px; color:var(--accent-purple-light); font-weight:normal">Awaiting your approval</span>
        `;
        container.appendChild(incHeader);

        incoming.forEach(req => {
          const reqCard = document.createElement('div');
          reqCard.className = 'request-card';
          const name = req.display_name || req.username || 'User';
          const initials = name.substring(0, 2).toUpperCase();

          reqCard.innerHTML = `
            <div class="request-user-info">
              <div class="item-avatar">${initials}</div>
              <div class="request-user-meta">
                <div class="request-user-name">${escapeHtml(name)}</div>
                <div class="request-user-handle">@${escapeHtml(req.username || '')} • Sent you a friend request</div>
              </div>
            </div>
            <div class="request-actions">
              <button class="btn-request-accept">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                Accept
              </button>
              <button class="btn-request-decline">✕ Decline</button>
            </div>
          `;

          const btnAccept = reqCard.querySelector('.btn-request-accept');
          btnAccept.addEventListener('click', async () => {
            btnAccept.disabled = true;
            btnAccept.textContent = 'Accepting...';
            await acceptFriendRequest(req.request_id, name);
          });

          const btnDecline = reqCard.querySelector('.btn-request-decline');
          btnDecline.addEventListener('click', async () => {
            btnDecline.disabled = true;
            btnDecline.textContent = 'Declining...';
            await rejectFriendRequest(req.request_id);
          });

          container.appendChild(reqCard);
        });
      }

      // 3. Sent Requests Section
      if (sent.length > 0) {
        const sentHeader = document.createElement('div');
        sentHeader.className = 'contacts-section-header';
        sentHeader.textContent = `📤 SENT REQUESTS (${sent.length})`;
        container.appendChild(sentHeader);

        sent.forEach(s => {
          const sentCard = document.createElement('div');
          sentCard.className = 'chat-item-card';
          sentCard.style.cursor = 'default';
          const name = s.display_name || s.username || 'User';
          const initials = name.substring(0, 2).toUpperCase();

          sentCard.innerHTML = `
            <div class="item-avatar">${initials}</div>
            <div class="item-info" style="flex:1">
              <div class="item-top">
                <span class="item-title">${escapeHtml(name)}</span>
                <span class="item-time">Pending</span>
              </div>
              <div class="item-bottom">
                <span class="item-preview">Waiting for @${escapeHtml(s.username || '')} to accept</span>
              </div>
            </div>
            <button class="btn-request-cancel">Cancel</button>
          `;

          const cancelBtn = sentCard.querySelector('.btn-request-cancel');
          cancelBtn.addEventListener('click', async () => {
            cancelBtn.disabled = true;
            cancelBtn.textContent = 'Canceling...';
            await cancelSentFriendRequest(s.request_id);
          });

          container.appendChild(sentCard);
        });
      }

      // 4. Contacts Circle Section
      const contactsHeader = document.createElement('div');
      contactsHeader.className = 'contacts-section-header';
      contactsHeader.textContent = `👥 MY CIRCLE (${Array.isArray(contacts) ? contacts.length : 0})`;
      container.appendChild(contactsHeader);

      if (!Array.isArray(contacts) || contacts.length === 0) {
        if (incoming.length === 0 && sent.length === 0) {
          const empty = document.createElement('div');
          empty.style.padding = '36px 20px';
          empty.style.textAlign = 'center';
          empty.style.color = 'var(--text-sub)';
          empty.style.fontSize = '13px';
          empty.innerHTML = `
            👥 No contacts in your circle yet.<br>
            <span style="font-size:11.5px; color:var(--text-dim); margin-top:6px; display:block">
              Use the search bar above to search @username and send friend requests!
            </span>
          `;
          container.appendChild(empty);
        }
      } else {
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
                <span class="item-preview">${escapeHtml(contact.status_message || 'Connected on KYNX')}</span>
              </div>
            </div>
            <div class="contact-actions" style="margin-left:auto; display:flex; gap:6px; align-items:center;">
              <button class="contact-action-btn btn-contact-profile" title="View Profile & Bio" type="button">👤</button>
              <button class="contact-action-btn danger btn-contact-remove" title="Remove from Circle" type="button">✕</button>
            </div>
          `;

          const btnProfile = card.querySelector('.btn-contact-profile');
          if (btnProfile) {
            btnProfile.addEventListener('click', (e) => {
              e.stopPropagation();
              openUserProfileModal(contact.id, false);
            });
          }

          const btnRemove = card.querySelector('.btn-contact-remove');
          if (btnRemove) {
            btnRemove.addEventListener('click', (e) => {
              e.stopPropagation();
              removeContact(contact.id, title);
            });
          }

          card.addEventListener('click', async () => {
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

          container.appendChild(card);
        });
      }

      el.conversationsList.appendChild(container);

    } catch (e) {
      console.warn('Could not load contacts and requests:', e);
      el.conversationsList.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--accent-red); font-size: 13px;">
          Failed to load contacts and requests.
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
    // Background Music Friendly: Do NOT trigger audio.play() on click/touch to avoid interrupting Spotify/Apple Music
  }

  function playNotificationSound() {
    if (AppState.audioMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
        setTimeout(() => ctx.close().catch(() => {}), 300);
        return;
      }
    } catch (_) {}
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
    const rawPreview = msg.text || msg.content || '';
    const textPreview = formatPowerPreview(rawPreview) || (msg.is_view_once ? '🔒 View-Once Media' : 'Sent an attachment');

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

  // ==========================================================================
  // UPDATES & STATUS STORIES ENGINE
  // ==========================================================================

  let currentStatusMode = 'photo';
  let selectedStatusFile = null;
  let activeStoryTimer = null;
  let activeStoryProgressInterval = null;
  let currentViewingStatuses = [];
  let currentViewingIndex = 0;

  function switchStatusMode(mode) {
    currentStatusMode = mode;
    if (mode === 'photo') {
      if (el.tabStatusPhoto) {
        el.tabStatusPhoto.classList.add('active');
        el.tabStatusPhoto.style.background = 'rgba(121,80,255,0.25)';
        el.tabStatusPhoto.style.borderColor = 'var(--accent-purple)';
        el.tabStatusPhoto.style.color = '#fff';
      }
      if (el.tabStatusText) {
        el.tabStatusText.classList.remove('active');
        el.tabStatusText.style.background = 'rgba(255,255,255,0.05)';
        el.tabStatusText.style.borderColor = 'transparent';
        el.tabStatusText.style.color = 'var(--text-sub)';
      }
      if (el.statusPhotoContainer) el.statusPhotoContainer.style.display = 'block';
      if (el.statusTextContainer) el.statusTextContainer.style.display = 'none';
      if (el.statusCaptionGroup) el.statusCaptionGroup.style.display = 'block';
    } else {
      if (el.tabStatusText) {
        el.tabStatusText.classList.add('active');
        el.tabStatusText.style.background = 'rgba(121,80,255,0.25)';
        el.tabStatusText.style.borderColor = 'var(--accent-purple)';
        el.tabStatusText.style.color = '#fff';
      }
      if (el.tabStatusPhoto) {
        el.tabStatusPhoto.classList.remove('active');
        el.tabStatusPhoto.style.background = 'rgba(255,255,255,0.05)';
        el.tabStatusPhoto.style.borderColor = 'transparent';
        el.tabStatusPhoto.style.color = 'var(--text-sub)';
      }
      if (el.statusPhotoContainer) el.statusPhotoContainer.style.display = 'none';
      if (el.statusTextContainer) el.statusTextContainer.style.display = 'block';
      if (el.statusCaptionGroup) el.statusCaptionGroup.style.display = 'none';
      if (el.statusTextInput) el.statusTextInput.focus();
    }
  }

  function openStatusPostModal() {
    selectedStatusFile = null;
    if (el.statusFileInput) el.statusFileInput.value = '';
    if (el.statusTextInput) el.statusTextInput.value = '';
    if (el.statusCaptionInput) el.statusCaptionInput.value = '';
    if (el.statusPreviewBox) el.statusPreviewBox.style.display = 'none';
    if (el.statusPlaceholderText) el.statusPlaceholderText.style.display = 'block';
    if (el.statusPostError) el.statusPostError.textContent = '';
    switchStatusMode('photo');
    if (el.statusPostModal) el.statusPostModal.style.display = 'flex';
  }

  function closeStatusPostModal() {
    if (el.statusPostModal) el.statusPostModal.style.display = 'none';
    selectedStatusFile = null;
  }

  function handleStatusFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    selectedStatusFile = file;
    const url = URL.createObjectURL(file);
    if (el.statusPreviewImg) el.statusPreviewImg.src = url;
    if (el.statusPreviewBox) el.statusPreviewBox.style.display = 'block';
    if (el.statusPlaceholderText) el.statusPlaceholderText.style.display = 'none';
  }

  async function submitStatusPost() {
    if (!AppState.token) return;
    if (el.statusPostError) el.statusPostError.textContent = '';

    try {
      if (el.btnSubmitStatus) el.btnSubmitStatus.disabled = true;

      let mediaUrl = null;
      let mediaType = 'text';
      let textContent = '';

      if (currentStatusMode === 'photo') {
        if (!selectedStatusFile) {
          throw new Error('Please select a photo or media file to post.');
        }
        textContent = el.statusCaptionInput ? el.statusCaptionInput.value.trim() : '';
        mediaType = 'image';

        const formData = new FormData();
        formData.append('file', selectedStatusFile);
        const upRes = await fetch(`${BACKEND_URL}/api/media/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${AppState.token}` },
          body: formData
        });
        if (!upRes.ok) throw new Error('Media upload failed. Please try again.');
        const upData = await upRes.json();
        mediaUrl = upData.url || upData.media_url;
      } else {
        textContent = el.statusTextInput ? el.statusTextInput.value.trim() : '';
        if (!textContent) {
          throw new Error('Please enter text for your status update.');
        }
        mediaType = null;
      }

      const res = await fetch(`${BACKEND_URL}/api/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AppState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textContent,
          media_url: mediaUrl || undefined,
          media_type: mediaType || undefined,
          expires_in_hours: 24
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to post status update.');
      }

      closeStatusPostModal();
      showHeadsUpCard('Status Updated ⚡', 'Your 24-hour status is now live in your circle!');
      if (AppState.activeTab === 'updates') {
        await loadAndRenderUpdates();
      }
    } catch (err) {
      if (el.statusPostError) el.statusPostError.textContent = err.message;
    } finally {
      if (el.btnSubmitStatus) el.btnSubmitStatus.disabled = false;
    }
  }

  async function deleteStatusPost(statusId) {
    if (!statusId || !AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/status/${statusId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) throw new Error('Failed to delete status');
      closeStoryViewer();
      showHeadsUpCard('Status Removed', 'Status update deleted successfully.');
      if (AppState.activeTab === 'updates') {
        await loadAndRenderUpdates();
      }
    } catch (err) {
      alert(err.message || 'Error deleting status.');
    }
  }

  function openStoryViewer(status, groupStatuses = []) {
    currentViewingStatuses = groupStatuses.length > 0 ? groupStatuses : [status];
    currentViewingIndex = currentViewingStatuses.findIndex(s => s.id === status.id);
    if (currentViewingIndex < 0) currentViewingIndex = 0;

    renderCurrentStoryItem();
    if (el.statusViewerModal) el.statusViewerModal.style.display = 'flex';
  }

  function renderCurrentStoryItem() {
    clearInterval(activeStoryProgressInterval);
    clearTimeout(activeStoryTimer);

    if (currentViewingIndex >= currentViewingStatuses.length) {
      closeStoryViewer();
      return;
    }

    const item = currentViewingStatuses[currentViewingIndex];
    const isMe = AppState.user && item.user_id === AppState.user.id;
    const authorName = item.display_name || item.username || (isMe ? 'You' : 'User');
    const authorInitial = authorName.substring(0, 2).toUpperCase();

    // Render multi-story progress bar segments
    if (el.storyProgressBarWrap) {
      el.storyProgressBarWrap.innerHTML = currentViewingStatuses.map((_, idx) => `
        <div style="flex:1; height:3px; background:rgba(255,255,255,0.3); border-radius:3px; overflow:hidden;">
          <div id="story-progress-fill-${idx}" style="height:100%; width:${idx < currentViewingIndex ? '100%' : '0%'}; background:#fff; transition:width 0.05s linear;"></div>
        </div>
      `).join('');
    }

    if (el.storyUserName) el.storyUserName.textContent = authorName;
    if (el.storyTimeText) el.storyTimeText.textContent = formatTimeAgo(item.created_at);
    if (el.storyUserAvatar) {
      el.storyUserAvatar.textContent = item.profile_photo_url ? '' : authorInitial;
      if (item.profile_photo_url) {
        el.storyUserAvatar.style.backgroundImage = `url('${resolveMediaUrl(item.profile_photo_url)}')`;
      } else {
        el.storyUserAvatar.style.backgroundImage = 'none';
      }
    }

    if (el.btnStoryDelete) {
      el.btnStoryDelete.style.display = isMe ? 'block' : 'none';
      el.btnStoryDelete.onclick = () => {
        if (confirm('Delete this status update?')) {
          deleteStatusPost(item.id);
        }
      };
    }

    if (item.media_url) {
      if (el.storyContentBox) el.storyContentBox.style.background = '#07090E';
      if (el.storyContentImg) {
        el.storyContentImg.src = resolveMediaUrl(item.media_url);
        el.storyContentImg.style.display = 'block';
      }
      if (el.storyContentText) el.storyContentText.style.display = 'none';
      if (el.storyCaptionText) el.storyCaptionText.textContent = item.text || '';
    } else {
      if (el.storyContentBox) el.storyContentBox.style.background = 'linear-gradient(135deg, #7950FF, #3B82F6)';
      if (el.storyContentImg) el.storyContentImg.style.display = 'none';
      if (el.storyContentText) {
        el.storyContentText.textContent = item.text || '';
        el.storyContentText.style.display = 'block';
      }
      if (el.storyCaptionText) el.storyCaptionText.textContent = '';
    }

    if (el.storyViewsText) {
      el.storyViewsText.textContent = isMe ? `👁️ ${item.view_count || 0} views` : '';
    }

    if (!isMe && item.id && AppState.token) {
      fetch(`${BACKEND_URL}/api/status/${item.id}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      }).catch(() => {});
    }

    const duration = 5000;
    const startTime = Date.now();
    const activeFill = document.getElementById(`story-progress-fill-${currentViewingIndex}`);

    activeStoryProgressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      if (activeFill) activeFill.style.width = `${pct}%`;
    }, 50);

    activeStoryTimer = setTimeout(() => {
      clearInterval(activeStoryProgressInterval);
      currentViewingIndex++;
      renderCurrentStoryItem();
    }, duration);
  }

  function closeStoryViewer() {
    clearInterval(activeStoryProgressInterval);
    clearTimeout(activeStoryTimer);
    if (el.statusViewerModal) el.statusViewerModal.style.display = 'none';
    currentViewingStatuses = [];
    currentViewingIndex = 0;
  }

  async function checkUpdatesBadge() {
    if (!AppState.token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) return;
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : [];
      const myId = AppState.user ? AppState.user.id : null;
      const others = list.filter(s => s.user_id !== myId);
      if (el.updatesBadgeDot) {
        if (others.length > 0 && AppState.activeTab !== 'updates') {
          el.updatesBadgeDot.style.display = 'inline-block';
        } else {
          el.updatesBadgeDot.style.display = 'none';
        }
      }
    } catch (_) {}
  }

  async function loadAndRenderUpdates() {
    if (!AppState.token) return;
    el.conversationsList.innerHTML = `
      <div style="padding: 30px 20px; text-align: center; color: var(--text-sub); font-size: 13px;">
        <div class="typing-dots" style="margin-bottom: 12px; justify-content: center;">
          <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
        </div>
        Syncing Status Updates...
      </div>`;

    try {
      const res = await fetch(`${BACKEND_URL}/api/status`, {
        headers: { 'Authorization': `Bearer ${AppState.token}` }
      });
      if (!res.ok) throw new Error('Failed to load statuses');
      const rawStatuses = await res.json();
      const allStatuses = Array.isArray(rawStatuses) ? rawStatuses : [];

      const myId = AppState.user ? AppState.user.id : null;
      const myStatuses = allStatuses.filter(s => s.user_id === myId);
      const otherStatuses = allStatuses.filter(s => s.user_id !== myId);

      const groupedOthers = {};
      otherStatuses.forEach(s => {
        if (!groupedOthers[s.user_id]) {
          groupedOthers[s.user_id] = {
            user_id: s.user_id,
            username: s.username,
            display_name: s.display_name || s.username,
            profile_photo_url: s.profile_photo_url,
            statuses: []
          };
        }
        groupedOthers[s.user_id].statuses.push(s);
      });

      let html = '';

      html += `
        <div style="padding: 12px 14px 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0;">Status Updates</h4>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">24-hour disappearing stories</div>
          </div>
          <button type="button" id="btn-trigger-add-status" style="background: linear-gradient(135deg, var(--accent-purple), var(--accent-purple-dark)); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 10px var(--accent-purple-glow); color: #fff; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
            <span>+</span> Add Update
          </button>
        </div>
      `;

      html += `
        <div style="padding: 6px 10px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-left: 4px;">My Status</div>
      `;

      if (myStatuses.length > 0) {
        const latest = myStatuses[0];
        const initial = (AppState.user.display_name || AppState.user.username || 'KG').substring(0, 2).toUpperCase();
        const views = myStatuses.reduce((acc, curr) => acc + (curr.view_count || 0), 0);
        html += `
          <div class="chat-item-card my-status-item" data-status-id="${latest.id}" style="border: 1px solid rgba(121, 80, 255, 0.35); background: rgba(121, 80, 255, 0.08); border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, #7950FF, #00FFCC);">
                <div style="width: 100%; height: 100%; border-radius: 50%; background: #131622; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 14px; background-size: cover; background-position: center; ${AppState.user.profile_photo_url ? `background-image: url('${resolveMediaUrl(AppState.user.profile_photo_url)}');` : ''}">
                  ${AppState.user.profile_photo_url ? '' : initial}
                </div>
              </div>
              <div>
                <div style="font-size: 13.5px; font-weight: 700; color: #fff;">My Status (${myStatuses.length})</div>
                <div style="font-size: 11.5px; color: var(--accent-purple-light); margin-top: 2px;">👁️ ${views} view${views === 1 ? '' : 's'} • Tap to view</div>
              </div>
            </div>
            <button type="button" class="btn-delete-my-status" data-status-id="${latest.id}" title="Delete update" style="background: none; border: none; color: var(--accent-red); font-size: 13px; cursor: pointer; padding: 6px;">🗑️</button>
          </div>
        `;
      } else {
        const initial = (AppState.user.display_name || AppState.user.username || 'KG').substring(0, 2).toUpperCase();
        html += `
          <div id="btn-add-status-empty" style="border: 1px dashed rgba(255, 255, 255, 0.18); border-radius: 12px; padding: 12px 14px; cursor: pointer; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.02); transition: all 0.2s;">
            <div style="position: relative; width: 42px; height: 42px; border-radius: 50%; background: rgba(121,80,255,0.15); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--accent-purple-light); font-size: 14px;">
              ${initial}
              <span style="position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-purple); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #06060C;">+</span>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #fff;">Add to my status</div>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 1px;">Share a photo or text update with circle</div>
            </div>
          </div>
        `;
      }

      html += `</div>`;

      html += `
        <div style="padding: 4px 10px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-left: 4px;">Recent Updates</div>
      `;

      const otherKeys = Object.keys(groupedOthers);
      if (otherKeys.length === 0) {
        html += `
          <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
            No recent updates from your circle.<br>When friends post updates, they will appear here!
          </div>
        `;
      } else {
        otherKeys.forEach(uid => {
          const group = groupedOthers[uid];
          const latest = group.statuses[0];
          const name = group.display_name || group.username;
          const initial = name.substring(0, 2).toUpperCase();
          const timeAgo = formatTimeAgo(latest.created_at);
          html += `
            <div class="chat-item-card other-status-item" data-user-id="${uid}" style="border-radius: 12px; padding: 10px 12px; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 4px; transition: background 0.15s;">
              <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; padding: 2px; background: linear-gradient(135deg, #7950FF, #EC4899);">
                <div style="width: 100%; height: 100%; border-radius: 50%; background: #131622; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 14px; background-size: cover; background-position: center; ${group.profile_photo_url ? `background-image: url('${resolveMediaUrl(group.profile_photo_url)}');` : ''}">
                  ${group.profile_photo_url ? '' : initial}
                </div>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13.5px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${timeAgo} • ${latest.media_url ? '📷 Photo' : '✍️ Text'}</div>
              </div>
            </div>
          `;
        });
      }

      html += `</div>`;
      el.conversationsList.innerHTML = html;

      const btnTriggerAdd = document.getElementById('btn-trigger-add-status');
      const btnAddEmpty = document.getElementById('btn-add-status-empty');
      if (btnTriggerAdd) btnTriggerAdd.addEventListener('click', openStatusPostModal);
      if (btnAddEmpty) btnAddEmpty.addEventListener('click', openStatusPostModal);

      const myItem = el.conversationsList.querySelector('.my-status-item');
      if (myItem) {
        myItem.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-my-status')) return;
          openStoryViewer(myStatuses[0], myStatuses);
        });
      }

      const btnDelMy = el.conversationsList.querySelector('.btn-delete-my-status');
      if (btnDelMy) {
        btnDelMy.addEventListener('click', async (e) => {
          e.stopPropagation();
          const sid = btnDelMy.dataset.statusId;
          if (confirm('Delete this status update?')) {
            await deleteStatusPost(sid);
          }
        });
      }

      el.conversationsList.querySelectorAll('.other-status-item').forEach(item => {
        item.addEventListener('click', () => {
          const uid = item.dataset.userId;
          const userGroup = groupedOthers[uid];
          if (userGroup && userGroup.statuses.length > 0) {
            openStoryViewer(userGroup.statuses[0], userGroup.statuses);
          }
        });
      });

    } catch (err) {
      el.conversationsList.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; color: var(--accent-red); font-size: 13px;">
          Failed to load status updates.<br>${err.message}
        </div>
      `;
    }
  }

  // ==========================================================================
  // SETTINGS & PREFERENCES ENGINE & THEMES
  // ==========================================================================

  const KYNX_THEMES = [
    { id: 'obsidian', name: 'Obsidian', bg: '#0B0B12', accent: '#7950FF', label: 'Cosmic Obsidian (Default)' },
    { id: 'cyan', name: 'Cyber Cyan', bg: '#081226', accent: '#00E5FF', label: 'Electric Cyber Aqua' },
    { id: 'emerald', name: 'Emerald', bg: '#051d11', accent: '#10B981', label: 'Matrix Hacker Green' },
    { id: 'crimson', name: 'Crimson', bg: '#1a080f', accent: '#F43F5E', label: 'Cyberpunk Ruby Red' },
    { id: 'amber', name: 'Solar Amber', bg: '#191206', accent: '#F59E0B', label: 'Solar Cyber Gold' },
    { id: 'amoled', name: 'AMOLED', bg: '#000000', accent: '#E4E4E7', label: 'Pure Pitch Black' }
  ];

  function getActiveTheme() {
    try {
      return localStorage.getItem('kynx_theme') || 'obsidian';
    } catch (_) {
      return 'obsidian';
    }
  }

  function applyTheme(themeId) {
    const valid = KYNX_THEMES.some(t => t.id === themeId);
    const target = valid ? themeId : 'obsidian';
    if (target === 'obsidian') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', target);
    }
    try {
      localStorage.setItem('kynx_theme', target);
    } catch (_) {}
    const themeObj = KYNX_THEMES.find(t => t.id === target);
    if (themeObj) {
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', themeObj.bg);
    }
  }

  // Apply saved theme on script boot
  applyTheme(getActiveTheme());

  async function loadAndRenderSettings() {
    if (!AppState.token) return;

    const user = AppState.user || {};
    const name = user.display_name || user.displayName || user.username || 'KYNX User';
    const username = user.username || 'kynx_user';
    const email = user.email || 'No email attached';
    const initial = name.substring(0, 2).toUpperCase();
    const isMuted = AppState.audioMuted;
    const currentTheme = getActiveTheme();

    let html = `
      <div style="padding: 14px 12px 30px;">
        <div style="margin-bottom: 14px; padding: 0 4px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0;">Settings & Preferences</h3>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">Manage profile, audio, privacy & sessions</div>
        </div>

        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--avatar-gradient); border: 2px solid var(--avatar-border); box-shadow: 0 0 10px var(--accent-purple-glow); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: var(--avatar-color); flex-shrink: 0; background-size: cover; background-position: center; transition: all 0.25s ease; ${user.profile_photo_url ? `background-image: url('${resolveMediaUrl(user.profile_photo_url)}');` : ''}">
              ${user.profile_photo_url ? '' : initial}
            </div>
            <div style="min-width: 0;">
              <div style="font-size: 14px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(name)}</div>
              <div style="font-size: 12px; color: var(--accent-purple-light); margin-top: 1px;">@${escapeHtml(username)}</div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(email)}</div>
            </div>
          </div>
          <button type="button" id="btn-settings-edit-profile" style="background: rgba(121,80,255,0.2); border: 1px solid var(--accent-purple); color: #fff; border-radius: 8px; padding: 6px 10px; font-size: 11.5px; font-weight: 600; cursor: pointer; flex-shrink: 0;">Edit</button>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Audio & Notifications</div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #fff;">In-App Audio Chimes</div>
              <div style="font-size: 11px; color: var(--text-muted);">Play soft cyber chime on incoming messages</div>
            </div>
            <input type="checkbox" id="chk-audio-toggle" ${isMuted ? '' : 'checked'} style="width: 18px; height: 18px; accent-color: var(--accent-purple); cursor: pointer;">
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #fff;">Background Music Safe Mode</div>
              <div style="font-size: 11px; color: var(--accent-green);">✓ Active (Never pauses Spotify / Apple Music)</div>
            </div>
            <button type="button" id="btn-test-chime" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer;">Test Chime 🔔</button>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Privacy & Ghost Link</div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #fff;">Ghost Shield Stealth Mode</div>
              <div style="font-size: 11px; color: var(--text-muted);">Mask presence and typing telemetry</div>
            </div>
            <button type="button" id="btn-settings-ghost-toggle" style="background: ${AppState.ghostShield ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.08)'}; border: 1px solid ${AppState.ghostShield ? '#00FFCC' : 'rgba(255,255,255,0.2)'}; color: ${AppState.ghostShield ? '#00FFCC' : '#fff'}; border-radius: 8px; padding: 5px 10px; font-size: 11.5px; font-weight: 600; cursor: pointer;">
              ${AppState.ghostShield ? '🛡️ Enabled' : 'Disabled'}
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-size: 13px; font-weight: 600; color: #fff;">View-Once Self Destruction</div>
              <div style="font-size: 11px; color: var(--text-muted);">Photos and voice notes vanish upon opening</div>
            </div>
            <span style="font-size: 11px; color: var(--accent-green); font-weight: 600;">Always On ⚡</span>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 14px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">
            <span>Theme & Appearance</span>
            <span style="font-size:11px; color:var(--accent-purple-light); font-weight:600;">${(KYNX_THEMES.find(t => t.id === currentTheme) || KYNX_THEMES[0]).name}</span>
          </div>

          <div class="theme-options-grid">
            ${KYNX_THEMES.map(t => `
              <div class="theme-option-card ${currentTheme === t.id ? 'active' : ''}" data-theme-id="${t.id}" title="${t.label}">
                ${currentTheme === t.id ? '<div class="theme-active-badge"></div>' : ''}
                <div class="theme-preview-swatch" style="background:${t.bg};">
                  <div class="theme-preview-dot" style="background:${t.accent};"></div>
                </div>
                <div class="theme-card-name" style="${currentTheme === t.id ? 'color:var(--accent-purple-light); font-weight:700;' : ''}">${t.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Platform & Build</div>
          
          <div style="font-size: 12px; color: var(--text-sub); line-height: 1.6;">
            <div>• <strong>App:</strong> KYNX Web Deck v0.9.38</div>
            <div>• <strong>Engine:</strong> WebRTC Voice/Video + WebSocket FastSync</div>
            <div>• <strong>Backend:</strong> FastAPI + Neon PostgreSQL Distributed Pool</div>
            <div>• <strong>Security:</strong> E2E AES-256-GCM + Ephemeral Session Tokens</div>
            <div style="margin-top: 4px; color: var(--accent-purple-light);">• <strong>Architect & Lead:</strong> Kavyansh Gautam (@kvynshgautam)</div>
          </div>
        </div>

        <button type="button" id="btn-settings-logout" style="width: 100%; padding: 12px; background: rgba(255, 0, 85, 0.12); border: 1px solid rgba(255, 0, 85, 0.4); border-radius: 10px; color: #FF4D6D; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
          🚪 Disconnect Session & Log Out
        </button>
      </div>
    `;

    el.conversationsList.innerHTML = html;

    const btnEditProfile = document.getElementById('btn-settings-edit-profile');
    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', () => {
        openUserProfileModal(AppState.user.id, true);
      });
    }

    const chkAudio = document.getElementById('chk-audio-toggle');
    if (chkAudio) {
      chkAudio.addEventListener('change', () => {
        AppState.audioMuted = !chkAudio.checked;
        localStorage.setItem('kynx_audio_muted', AppState.audioMuted ? 'true' : 'false');
      });
    }

    const btnTestChime = document.getElementById('btn-test-chime');
    if (btnTestChime) {
      btnTestChime.addEventListener('click', () => {
        const wasMuted = AppState.audioMuted;
        AppState.audioMuted = false;
        playNotificationSound();
        AppState.audioMuted = wasMuted;
      });
    }

    const btnGhostToggle = document.getElementById('btn-settings-ghost-toggle');
    if (btnGhostToggle) {
      btnGhostToggle.addEventListener('click', () => {
        toggleGhostShield();
        loadAndRenderSettings();
      });
    }

    const btnLogout = document.getElementById('btn-settings-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => logout(true));
    }

    el.conversationsList.querySelectorAll('.theme-option-card').forEach(card => {
      card.addEventListener('click', () => {
        const tid = card.dataset.themeId;
        if (tid) {
          applyTheme(tid);
          loadAndRenderSettings();
        }
      });
    });
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
    const cards = el.conversationsList.querySelectorAll('.chat-item-card, .request-card');
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
