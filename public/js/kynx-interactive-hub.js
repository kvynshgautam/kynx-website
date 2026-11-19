// ==============================================================================
// KYNX INTERACTIVE CYBER LAB & ARCHITECTURE ENGINE (REACT 18)
// Designed & Engineered by KG (Kavyansh Gautam) | Lead Architect
// Interactive Multi-Hop Zero-Knowledge Mesh, Web Deck Sync & Crypto Matrix
// ==============================================================================

(function () {
  'use strict';

  function initReactLab() {
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      console.warn('[KYNX LAB] React 18 not yet available, retrying...');
      setTimeout(initReactLab, 150);
      return;
    }

    const container = document.getElementById('kynx-react-lab-root');
    if (!container) return;

    const { useState, useEffect } = React;
    const h = React.createElement;

    function KynxCyberLab() {
      const [activeTab, setActiveTab] = useState('mesh'); // 'mesh' | 'webdeck' | 'crypto'

      // ==========================================
      // TAB 1: MULTI-HOP MESH SIMULATOR
      // ==========================================
      const [hopCount, setHopCount] = useState(4); // 2..5 hops
      const [meshMessage, setMeshMessage] = useState('Encrypted Mesh Intel #849 ⚡');
      const [packetPosition, setPacketPosition] = useState(null); // active node index
      const [isTransmitting, setIsTransmitting] = useState(false);
      const [selectedNode, setSelectedNode] = useState(0);
      const [nodeDropout, setNodeDropout] = useState(false);
      const [showVideoGuide, setShowVideoGuide] = useState(false);
      const [logs, setLogs] = useState([
        { id: 1, ts: '14:20:00', text: 'KYNX Mesh Grid Initialized. P2P Cluster strategy online.', type: 'info' },
        { id: 2, ts: '14:20:02', text: 'Nodes exchanged ECDH secp256r1 keys via ANNOUNCE beacons.', type: 'success' }
      ]);

      const addLog = (text, type = 'info') => {
        const time = new Date().toTimeString().split(' ')[0];
        setLogs(prev => [{ id: Date.now() + Math.random(), ts: time, text, type }, ...prev.slice(0, 6)]);
      };

      const transmitPacket = () => {
        if (isTransmitting) return;
        setIsTransmitting(true);
        setPacketPosition(0);
        setSelectedNode(0);
        addLog(`[SRC User 1]: Encrypted "${meshMessage}" with User 100 PubKey (AES-256-GCM). Transmitting...`, 'info');

        let current = 0;
        const totalHops = hopCount;

        const interval = setInterval(() => {
          current++;
          setPacketPosition(current);
          setSelectedNode(current);

          if (current < totalHops) {
            const relayLabel = (nodeDropout && current === 2)
              ? 'Node 2B (Alternate User 52)'
              : `Node ${current + 1} (Relay User ${current * 24})`;
            addLog(`[RELAY ${relayLabel}]: Blind forward. Private key absent (Zero-Knowledge). TTL: ${7 - current}`, 'warning');
          } else {
            clearInterval(interval);
            setIsTransmitting(false);
            addLog(`[DEST User 100]: Private Key matches! Decrypted successfully. ACK receipt returned.`, 'success');
          }
        }, 700);
      };

      const toggleDropout = () => {
        const next = !nodeDropout;
        setNodeDropout(next);
        if (next) {
          addLog('[FAULT DETECTED]: Node 3 dropped out! removeRoutesViaEndpoint() triggered.', 'danger');
          addLog('[AUTO-HEALING]: Alternate path discovered via Node 2B (User 52). Mesh route healed!', 'success');
        } else {
          addLog('[GRID RESTORED]: Node 3 back online. Shortest-hop routing restored.', 'info');
        }
      };

      // Generate nodes list based on hopCount
      const nodes = [];
      nodes.push({ id: 0, label: 'User 1 (You)', role: 'Sender / Origin', hops: 0, est: '0m', isOrigin: true });
      for (let i = 1; i < hopCount; i++) {
        if (nodeDropout && i === 2) {
          nodes.push({ id: i, label: 'Node 2B (User 52)', role: 'Healed Route Relay', hops: i, est: `${i * 30}m`, isBypass: true });
        } else {
          nodes.push({ id: i, label: `Node ${i + 1} (User ${i * 24})`, role: 'Relay Node', hops: i, est: `${i * 30}m` });
        }
      }
      nodes.push({ id: hopCount, label: 'User 100 (Peer)', role: 'Target Recipient', hops: hopCount, est: `${hopCount * 30}m`, isTarget: true });

      const activeNodeInfo = nodes[selectedNode] || nodes[0];

      // ==========================================
      // TAB 2: WEB DECK SYNC SIMULATOR
      // ==========================================
      const [webDeckLinked, setWebDeckLinked] = useState(false);
      const [webStatusToast, setWebStatusToast] = useState(null);
      const [phoneStatusToast, setPhoneStatusToast] = useState(null);
      const [pinCode] = useState('849 201');

      const triggerWebToast = (msg) => {
        setWebStatusToast(msg);
        setTimeout(() => setWebStatusToast(null), 3200);
      };
      const triggerPhoneToast = (msg) => {
        setPhoneStatusToast(msg);
        setTimeout(() => setPhoneStatusToast(null), 3200);
      };

      const linkSession = () => {
        setWebDeckLinked(true);
        triggerWebToast('⚡ Paired! KYNX Web Deck Unlocked.');
        triggerPhoneToast('✅ Web Deck Connected: Chrome PC active.');
      };

      const logoutOnWeb = () => {
        setWebDeckLinked(false);
        triggerWebToast('🚪 Disconnected & Logged out from Web Deck.');
        triggerPhoneToast('ℹ️ Real-time unlinked: Mobile badge updated to NEW.');
      };

      const remoteDisconnectOnPhone = () => {
        setWebDeckLinked(false);
        triggerWebToast('🛑 Session Terminated remotely from Phone.');
        triggerPhoneToast('🛑 Desktop Session Disconnected.');
      };

      // ==========================================
      // RENDER MAIN COMPONENT
      // ==========================================
      return h('div', { className: 'kynx-lab-card' },
        // Top HUD Header
        h('div', { className: 'kynx-lab-header' },
          h('div', { className: 'kynx-lab-badge' },
            h('span', { className: 'pulse-dot-green' }),
            'REACT 18 CYBER ARCHITECTURE LAB • BUILD 63'
          ),
          h('h3', { className: 'kynx-lab-title' }, 'Test KYNX Flagship Systems Live'),
          h('p', { className: 'kynx-lab-sub' },
            'Interact with real-time multi-hop zero-knowledge mesh relaying, bidirectional Web Deck logout synchronization, and military-grade cryptographic pipelines.'
          ),

          // Tab Navigation Pills
          h('div', { className: 'kynx-lab-tabs' },
            h('button', {
              className: `lab-tab-pill ${activeTab === 'mesh' ? 'active' : ''}`,
              onClick: () => setActiveTab('mesh')
            }, '🛰️ Multi-Hop Offline Mesh Grid'),
            h('button', {
              className: `lab-tab-pill ${activeTab === 'webdeck' ? 'active' : ''}`,
              onClick: () => setActiveTab('webdeck')
            }, '💻 Bidirectional Web Deck Sync'),
            h('button', {
              className: `lab-tab-pill ${activeTab === 'crypto' ? 'active' : ''}`,
              onClick: () => setActiveTab('crypto')
            }, '🔒 Cryptographic Engine Matrix')
          )
        ),

        // ==========================================
        // TAB 1: MESH SIMULATOR VIEW
        // ==========================================
        activeTab === 'mesh' && h('div', { className: 'lab-content-section' },
          // Controls Row
          h('div', { className: 'mesh-controls-bar' },
            h('div', { className: 'mesh-input-group' },
              h('label', { className: 'mesh-input-label' }, 'Secret Message Payload:'),
              h('input', {
                type: 'text',
                className: 'cyber-lab-input',
                value: meshMessage,
                onChange: (e) => setMeshMessage(e.target.value),
                placeholder: 'Enter secret text...',
                maxLength: 60
              })
            ),
            h('div', { className: 'mesh-input-group hops-selector' },
              h('label', { className: 'mesh-input-label' }, `Hops Away: ${hopCount} Hops (~${hopCount * 30}m)`),
              h('input', {
                type: 'range',
                min: 2,
                max: 5,
                step: 1,
                value: hopCount,
                disabled: isTransmitting,
                onChange: (e) => {
                  const val = parseInt(e.target.value);
                  setHopCount(val);
                  setPacketPosition(null);
                  setSelectedNode(0);
                },
                className: 'cyber-range-slider'
              })
            ),
            h('div', { className: 'mesh-actions-group' },
              h('button', {
                className: 'btn-cyber-lab primary',
                disabled: isTransmitting,
                onClick: transmitPacket
              }, isTransmitting ? '⚡ Transmitting Across Mesh...' : '🚀 Transmit Encrypted Packet'),
              h('button', {
                className: `btn-cyber-lab ${nodeDropout ? 'active-warning' : 'outline'}`,
                onClick: toggleDropout
              }, nodeDropout ? '🔄 Restore Dropped Node' : '💥 Simulate Node Dropout'),
              h('button', {
                className: 'btn-cyber-lab outline',
                style: { borderColor: 'rgba(16, 185, 129, 0.45)', color: '#34d399' },
                onClick: () => setShowVideoGuide(prev => !prev)
              }, showVideoGuide ? '✕ Hide Video' : '🎬 Watch Video Guide')
            )
          ),

          // Optional Inline Video Guide Player
          showVideoGuide && h('div', { className: 'mesh-video-container', style: { marginBottom: '24px' } },
            h('div', { className: 'mesh-video-header' },
              h('div', { className: 'video-status-dot' }),
              h('span', { className: 'video-title-tag' }, 'KYNX OFFLINE MESH // VIDEO WALKTHROUGH & STEP-BY-STEP GUIDE'),
              h('span', { className: 'video-quality-tag' }, '1080P HD • 0 CELLULAR')
            ),
            h('div', { className: 'mesh-video-wrapper' },
              h('video', {
                className: 'mesh-cyber-video',
                controls: true,
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                poster: '/assets/mesh_demo_guide_poster.jpg'
              },
                h('source', { src: '/assets/mesh_demo_guide.mp4', type: 'video/mp4' })
              )
            )
          ),

          // Visual Mesh Nodes Grid Canvas
          h('div', { className: 'mesh-nodes-canvas' },
            h('div', { className: 'canvas-grid-lines' }),
            h('div', { className: 'nodes-track' },
              nodes.map((node, idx) => {
                const isPacketHere = packetPosition === idx;
                const isSelected = selectedNode === idx;
                let nodeStatusClass = '';
                if (node.isOrigin) nodeStatusClass = 'hub-node-origin';
                else if (node.isTarget) nodeStatusClass = 'hub-node-target';
                else if (node.isBypass) nodeStatusClass = 'hub-node-bypass';
                else nodeStatusClass = 'hub-node-relay';

                return h('div', {
                  key: node.id,
                  className: `mesh-node-item ${nodeStatusClass} ${isPacketHere ? 'packet-active' : ''} ${isSelected ? 'selected' : ''}`,
                  onClick: () => setSelectedNode(idx)
                },
                  // Hop badge
                  h('div', { className: 'node-hop-badge' }, idx === 0 ? 'SRC' : (idx === hopCount ? 'DEST' : `HOP ${idx}`)),
                  // Node Icon
                  h('div', { className: 'node-icon-circle' },
                    idx === 0 ? '📱' : (idx === hopCount ? '🎯' : (node.isBypass ? '⚡' : '🔄')),
                    isPacketHere && h('span', { className: 'packet-ping-glow' })
                  ),
                  // Name and Distance
                  h('div', { className: 'node-name' }, node.label),
                  h('div', { className: 'node-dist' }, node.est),
                  // Tap to Inspect
                  h('div', { className: 'node-inspect-hint' }, isSelected ? '● INSPECTING' : 'Tap to inspect')
                );
              })
            )
          ),

          // Inspection & Console Dual Columns
          h('div', { className: 'mesh-details-split' },
            // Left: Node Inspector
            h('div', { className: 'mesh-inspector-card' },
              h('div', { className: 'card-terminal-bar' },
                h('span', { className: 'dot red' }),
                h('span', { className: 'dot yellow' }),
                h('span', { className: 'dot green' }),
                h('span', { className: 'terminal-card-title' }, `NODE INSPECTOR: ${activeNodeInfo.label}`)
              ),
              h('div', { className: 'inspector-content' },
                h('div', { className: 'inspect-row' },
                  h('span', { className: 'inspect-label' }, 'Node Role:'),
                  h('span', { className: 'inspect-val highlight' }, activeNodeInfo.role)
                ),
                h('div', { className: 'inspect-row' },
                  h('span', { className: 'inspect-label' }, 'Distance / Hop:'),
                  h('span', { className: 'inspect-val' }, `${activeNodeInfo.hops} hops (~${activeNodeInfo.est})`)
                ),
                h('div', { className: 'inspect-row' },
                  h('span', { className: 'inspect-label' }, 'Payload Visibility:'),
                  activeNodeInfo.isOrigin || activeNodeInfo.isTarget
                    ? h('span', { className: 'inspect-val green' }, '🔓 Plaintext Visible (Authorized Identity)')
                    : h('span', { className: 'inspect-val red' }, '🔒 ZERO-KNOWLEDGE (Opaque Ciphertext - Private Key Missing)')
                ),
                h('div', { className: 'inspect-payload-box' },
                  h('div', { className: 'box-caption' }, activeNodeInfo.isOrigin || activeNodeInfo.isTarget ? 'Decrypted Content:' : 'Relay Envelope (What this node sees):'),
                  h('code', { className: 'payload-code' },
                    activeNodeInfo.isOrigin || activeNodeInfo.isTarget
                      ? `"${meshMessage}"`
                      : `{"pub":"BG9sK...","iv":"a8x9F1m...","ct":"8f3a9b21e05d..."}`
                  )
                ),
                h('div', { className: 'inspect-footer-hint' },
                  activeNodeInfo.isOrigin || activeNodeInfo.isTarget
                    ? '✨ Endpoint authenticated using ECDH (secp256r1) + AES-256-GCM 128-bit integrity tag.'
                    : '🛡️ Intermediate nodes act strictly as blind repeaters with zero decryption capability.'
                )
              )
            ),

            // Right: Real-time Terminal Log
            h('div', { className: 'mesh-terminal-card' },
              h('div', { className: 'card-terminal-bar' },
                h('span', { className: 'dot green' }),
                h('span', { className: 'terminal-card-title' }, 'LIVE MESH PACKET STREAM')
              ),
              h('div', { className: 'terminal-log-list' },
                logs.map(log =>
                  h('div', { key: log.id, className: `log-entry log-${log.type}` },
                    h('span', { className: 'log-ts' }, `[${log.ts}]`),
                    h('span', { className: 'log-msg' }, log.text)
                  )
                )
              )
            )
          )
        ),

        // ==========================================
        // TAB 2: WEB DECK SYNC VIEW
        // ==========================================
        activeTab === 'webdeck' && h('div', { className: 'lab-content-section' },
          h('div', { className: 'sync-demo-grid' },
            // Left Mockup: Android App
            h('div', { className: 'mockup-device-card phone' },
              h('div', { className: 'mockup-header' },
                h('span', null, '📱 KYNX Android App'),
                h('span', { className: `sync-badge ${webDeckLinked ? 'connected' : 'new'}` },
                  webDeckLinked ? 'CONNECTED' : 'NEW'
                )
              ),
              h('div', { className: 'mockup-body' },
                phoneStatusToast && h('div', { className: 'mockup-toast' }, phoneStatusToast),
                h('div', { className: 'phone-settings-mock' },
                  h('div', { className: 'phone-item-row' },
                    h('div', { className: 'phone-item-icon' }, '💻'),
                    h('div', { className: 'phone-item-info' },
                      h('div', { className: 'phone-item-title' }, 'Linked Devices (KYNX Web)'),
                      h('div', { className: 'phone-item-sub' },
                        webDeckLinked
                          ? '1 Active Session • Web Deck Connected'
                          : 'Use KYNX on PC/Mac • getkynx.vercel.app/web'
                      )
                    )
                  ),
                  webDeckLinked ? h('div', { className: 'linked-active-box' },
                    h('div', { className: 'active-label' }, '● Encrypted WebRTC Bridge Online'),
                    h('div', { className: 'active-meta' }, 'Chrome Web Deck (Paired via 6-Digit Code)'),
                    h('button', {
                      className: 'btn-mock-danger',
                      onClick: remoteDisconnectOnPhone
                    }, '🛑 Disconnect Session From Phone')
                  ) : h('div', { className: 'link-actions-box' },
                    h('button', {
                      className: 'btn-mock-primary',
                      onClick: linkSession
                    }, '📷 Scan Cyber QR Code / Link Deck ⚡')
                  )
                )
              )
            ),

            // Right Mockup: Desktop Web Deck
            h('div', { className: 'mockup-device-card desktop' },
              h('div', { className: 'mockup-header' },
                h('span', null, '🖥️ KYNX Web Deck (getkynx.vercel.app/web)'),
                h('span', { className: `sync-badge ${webDeckLinked ? 'connected' : 'waiting'}` },
                  webDeckLinked ? 'AUTHENTICATED' : 'WAITING FOR APPROVAL'
                )
              ),
              h('div', { className: 'mockup-body' },
                webStatusToast && h('div', { className: 'mockup-toast web' }, webStatusToast),
                !webDeckLinked ? h('div', { className: 'web-pairing-mock' },
                  h('div', { className: 'mock-qr-wrap' },
                    h('div', { className: 'mock-qr-matrix' }, '⚡ [CYBER QR MATRIX] ⚡')
                  ),
                  h('div', { className: 'mock-pair-code' }, pinCode),
                  h('div', { className: 'mock-pair-status' }, '⚡ Waiting for approval from KYNX App...'),
                  h('button', {
                    className: 'btn-mock-primary',
                    style: { marginTop: '12px' },
                    onClick: linkSession
                  }, '⚡ Simulate Scan Approval from Mobile')
                ) : h('div', { className: 'web-chat-mock' },
                  h('div', { className: 'mock-chat-header' },
                    h('div', { className: 'mock-user-badge' },
                      h('div', { className: 'mock-avatar' }, 'KG'),
                      h('div', null,
                        h('div', { style: { fontWeight: '700', fontSize: '13px' } }, 'Gaurav Gautam'),
                        h('div', { style: { fontSize: '11px', color: '#10b981' } }, '● Hardware Encrypted')
                      )
                    ),
                    h('button', {
                      className: 'btn-mock-danger-sm',
                      onClick: logoutOnWeb
                    }, '🚪 Log Out Web Deck')
                  ),
                  h('div', { className: 'mock-chat-messages' },
                    h('div', { className: 'mock-msg in' }, 'Bhai Web Deck connected with 120 FPS speed!'),
                    h('div', { className: 'mock-msg out' }, 'Haan bhai, real-time bidirectional logout live hai!')
                  ),
                  h('div', { className: 'mock-chat-actions-foot' },
                    h('span', { style: { fontSize: '11px', color: '#94a3b8' } }, 'Try tapping "Log Out Web Deck" or "Disconnect from Phone" to observe live sync.')
                  )
                )
              )
            )
          )
        ),

        // ==========================================
        // TAB 3: CRYPTOGRAPHIC MATRIX VIEW
        // ==========================================
        activeTab === 'crypto' && h('div', { className: 'lab-content-section' },
          h('div', { className: 'crypto-pillars-grid' },
            [
              { icon: '🔑', title: 'ECDH secp256r1', tag: 'NATIVE HARDWARE', desc: 'Native Elliptic-Curve Diffie-Hellman key agreement in Android JCA keystore. Zero external bloat.' },
              { icon: '🛡️', title: 'AES-256-GCM AEAD', tag: 'AUTHENTICATED ENCRYPTION', desc: 'Galois/Counter Mode with 12-byte cryptographically secure random nonces and 128-bit integrity tags.' },
              { icon: '🔄', title: 'Loop-Free Bounded LRU', tag: 'STORM IMMUNITY', desc: '1,500-entry synchronized memory set and 7-hop TTL bounding preventing packet storms and battery drain.' },
              { icon: '⚡', title: '16 KB Page Alignment', tag: 'ANDROID 15+ READY', desc: 'Strict memory compliance (max-page-size=16384). Verified zero-crash execution across upcoming Android devices.' },
              { icon: '🎮', title: 'Locked 120 FPS Skia', tag: 'HARDWARE ACCELERATION', desc: 'Jetpack Compose GPU pipelines with custom DrawScope shaders and zero frame drops on 120Hz displays.' },
              { icon: '🌐', title: 'Self-Healing Pruning', tag: 'DYNAMIC RE-ROUTING', desc: 'Instant dead-link pruning (removeRoutesViaEndpoint) prevents dangling routes when a peer walks away.' }
            ].map((item, idx) =>
              h('div', { key: idx, className: 'crypto-pillar-card' },
                h('div', { className: 'pillar-top' },
                  h('span', { className: 'pillar-icon' }, item.icon),
                  h('span', { className: 'pillar-tag' }, item.tag)
                ),
                h('h4', { className: 'pillar-title' }, item.title),
                h('p', { className: 'pillar-desc' }, item.desc)
              )
            )
          )
        )
      );
    }

    ReactDOM.createRoot(container).render(h(KynxCyberLab));
    console.log('[KYNX LAB] React 18 Cyber Lab Mounted Successfully.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactLab);
  } else {
    initReactLab();
  }
})();
