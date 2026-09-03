import type { GameClientState } from '../state/gameClientState.js';

let ctfContainer: HTMLElement | null = null;
let toastContainer: HTMLElement | null = null;
let debuffBadge: HTMLElement | null = null;

export function initFlagUI(): void {
  // 1. CTF Top Scoreboard & Flag Status Container
  ctfContainer = document.createElement('div');
  ctfContainer.id = 'ctf-scoreboard';
  ctfContainer.style.cssText = `
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 100;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
  `;

  ctfContainer.innerHTML = `
    <!-- Top Score Bar -->
    <div style="
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 8px 24px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    ">
      <!-- Blue Team -->
      <div style="display: flex; align-items: center; gap: 8px; color: #60A5FA; font-weight: 800; font-size: 16px;">
        <span>🔵 MAVİ</span>
        <span id="ctf-blue-score" style="font-size: 22px; background: rgba(59, 130, 246, 0.25); padding: 2px 10px; border-radius: 8px; border: 1px solid #3B82F6;">0</span>
      </div>

      <span style="color: #94A3B8; font-weight: 700; font-size: 14px;">HƏDƏF: 3</span>

      <!-- Red Team -->
      <div style="display: flex; align-items: center; gap: 8px; color: #F87171; font-weight: 800; font-size: 16px;">
        <span id="ctf-red-score" style="font-size: 22px; background: rgba(239, 68, 68, 0.25); padding: 2px 10px; border-radius: 8px; border: 1px solid #EF4444;">0</span>
        <span>QIRMIZI 🔴</span>
      </div>
    </div>

    <!-- Flag Status Mini Badges -->
    <div style="display: flex; gap: 12px;">
      <div id="ctf-blue-flag-status" style="
        background: rgba(15, 23, 42, 0.75);
        color: #93C5FD;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(59, 130, 246, 0.3);
      ">
        🔵 Bayraq: 🏠 Evdə
      </div>

      <div id="ctf-red-flag-status" style="
        background: rgba(15, 23, 42, 0.75);
        color: #FCA5A5;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid rgba(239, 68, 68, 0.3);
      ">
        🔴 Bayraq: 🏠 Evdə
      </div>
    </div>
  `;

  document.body.appendChild(ctfContainer);

  // 2. Global Toast Notification Container
  toastContainer = document.createElement('div');
  toastContainer.id = 'ctf-toasts';
  toastContainer.style.cssText = `
    position: fixed;
    top: 90px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 200;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;
  document.body.appendChild(toastContainer);

  // 3. Speed Debuff Badge (bottom center)
  debuffBadge = document.createElement('div');
  debuffBadge.id = 'ctf-debuff-badge';
  debuffBadge.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(220, 38, 38, 0.9);
    color: white;
    font-weight: 700;
    font-size: 13px;
    padding: 6px 18px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.5);
    display: none;
    z-index: 100;
    pointer-events: none;
    animation: pulse 1.2s infinite;
  `;
  debuffBadge.textContent = '⚡ −15% Sürət (Düşmən Bayrağını Daşıyırsınız!)';
  document.body.appendChild(debuffBadge);
}

export function updateFlagUI(state: GameClientState): void {
  const ctf = state.ctf;
  if (!ctf) return;

  const blueScoreEl = document.getElementById('ctf-blue-score');
  const redScoreEl  = document.getElementById('ctf-red-score');
  if (blueScoreEl) blueScoreEl.textContent = String(ctf.scores.blue);
  if (redScoreEl)  redScoreEl.textContent  = String(ctf.scores.red);

  // Update Blue Flag Status Badge
  const blueFlagEl = document.getElementById('ctf-blue-flag-status');
  if (blueFlagEl) {
    const bf = ctf.flags.blue;
    if (bf.status === 'AT_HOME') {
      blueFlagEl.textContent = '🔵 Mavi Bayraq: 🏠 Qalada';
      blueFlagEl.style.borderColor = 'rgba(59, 130, 246, 0.4)';
    } else if (bf.status === 'CARRIED') {
      const carrier = bf.carrierId ? state.players[bf.carrierId] : null;
      blueFlagEl.textContent = `🔵 Mavi Bayraq: 🏃 ${carrier ? carrier.name : 'Oğurlanıb'}`;
      blueFlagEl.style.borderColor = '#EF4444'; // Alarm red border
    } else if (bf.status === 'DROPPED') {
      blueFlagEl.textContent = `🔵 Mavi Bayraq: ⬇️ Yerdə (${Math.ceil(bf.dropTimer)}s)`;
      blueFlagEl.style.borderColor = '#F59E0B'; // Yellow warning
    }
  }

  // Update Red Flag Status Badge
  const redFlagEl = document.getElementById('ctf-red-flag-status');
  if (redFlagEl) {
    const rf = ctf.flags.red;
    if (rf.status === 'AT_HOME') {
      redFlagEl.textContent = '🔴 Qırmızı Bayraq: 🏠 Qalada';
      redFlagEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else if (rf.status === 'CARRIED') {
      const carrier = rf.carrierId ? state.players[rf.carrierId] : null;
      redFlagEl.textContent = `🔴 Qırmızı Bayraq: 🏃 ${carrier ? carrier.name : 'Oğurlanıb'}`;
      redFlagEl.style.borderColor = '#3B82F6';
    } else if (rf.status === 'DROPPED') {
      redFlagEl.textContent = `🔴 Qırmızı Bayraq: ⬇️ Yerdə (${Math.ceil(rf.dropTimer)}s)`;
      redFlagEl.style.borderColor = '#F59E0B';
    }
  }

  // Speed Debuff Badge for Local Player
  if (debuffBadge && state.localPlayerId) {
    const me = state.players[state.localPlayerId];
    if (me && me.hasFlag) {
      debuffBadge.style.display = 'block';
    } else {
      debuffBadge.style.display = 'none';
    }
  }
}

export function showCTFToast(text: string, color = '#3B82F6'): void {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: rgba(15, 23, 42, 0.92);
    color: #FFFFFF;
    font-weight: 700;
    font-size: 14px;
    padding: 10px 22px;
    border-radius: 12px;
    border-left: 5px solid ${color};
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    opacity: 0;
    transform: translateY(-12px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;
  toast.textContent = text;
  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remove after 3.2s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-12px)';
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}