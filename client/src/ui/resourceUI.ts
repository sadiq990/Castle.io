import { getPlayerResources, onResourceChange } from '../resources/ResourceManager.js';
import { getActiveBuildType, setActiveBuildType } from '../fences/FenceManager.js';
import { commandAllSlaves } from '../slaves/SlaveManager.js';

let containerEl: HTMLDivElement | null = null;
let resourceHudEl: HTMLDivElement | null = null;
let buildPanelEl: HTMLDivElement | null = null;

export function initResourceUI(onBuildClick?: () => void): void {
  if (containerEl) return;

  // 1. Top-Left Resource Counter HUD
  resourceHudEl = document.createElement('div');
  resourceHudEl.id = 'resource-hud';
  resourceHudEl.style.cssText = `
    position: fixed;
    top: 14px;
    left: 14px;
    z-index: 1000;
    display: flex;
    gap: 12px;
    background: rgba(15, 23, 42, 0.82);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    padding: 8px 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    backdrop-filter: blur(6px);
  `;
  document.body.appendChild(resourceHudEl);

  // 2. Bottom-Right Army & Building Command Panel
  buildPanelEl = document.createElement('div');
  buildPanelEl.id = 'build-command-panel';
  buildPanelEl.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(15, 23, 42, 0.88);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #fff;
    backdrop-filter: blur(8px);
    width: 250px;
  `;

  buildPanelEl.innerHTML = `
    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 2px;">
      🧱 Hasar Tikintisi
    </div>
    <div style="display: flex; gap: 6px;">
      <button id="btn-build-wood" style="flex: 1; padding: 7px 4px; background: #8b5a2b; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;">
        🪵 Taxta (5)
      </button>
      <button id="btn-build-stone" style="flex: 1; padding: 7px 4px; background: #57534e; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;">
        🪨 Daş (10)
      </button>
    </div>

    <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-top: 6px; margin-bottom: 2px;">
      ⛏️ Mini Ordu (10 Slave)
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <button id="btn-slave-forest" style="padding: 6px; background: #15803d; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; text-align: left;">
        🪓 Hamısı Meşəyə (Odun Yığ)
      </button>
      <button id="btn-slave-mine" style="padding: 6px; background: #b45309; border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; text-align: left;">
        ⛏️ Hamısı Mədənə (Daş Yığ)
      </button>
      <button id="btn-slave-idle" style="padding: 5px; background: #334155; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; color: #cbd5e1; font-size: 11px; font-weight: 600; cursor: pointer;">
        🛑 Hamısı Dayansın (Qalaya Qayıt)
      </button>
    </div>
    <div style="font-size: 10px; color: #64748b; margin-top: 4px; text-align: center;">
      Qısa yol: [1] Taxta, [2] Daş, [B] Tik
    </div>
  `;
  document.body.appendChild(buildPanelEl);

  // Wire Resource State Updates
  onResourceChange(res => {
    if (resourceHudEl) {
      resourceHudEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 5px;">
          <span>🪵</span> <span style="color: #fcd34d;">${res.wood}</span>
        </div>
        <div style="width: 1px; background: rgba(255,255,255,0.2); height: 18px; margin: 0 4px;"></div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <span>🪨</span> <span style="color: #e2e8f0;">${res.stone}</span>
        </div>
      `;
    }
  });

  // Wire Buttons
  const btnWood = document.getElementById('btn-build-wood')!;
  const btnStone = document.getElementById('btn-build-stone')!;

  btnWood.addEventListener('click', () => {
    const cur = getActiveBuildType();
    setActiveBuildType(cur === 'WOOD' ? null : 'WOOD');
    updateBuildButtons();
  });

  btnStone.addEventListener('click', () => {
    const cur = getActiveBuildType();
    setActiveBuildType(cur === 'STONE' ? null : 'STONE');
    updateBuildButtons();
  });

  document.getElementById('btn-slave-forest')!.addEventListener('click', () => {
    commandAllSlaves('FOREST');
  });

  document.getElementById('btn-slave-mine')!.addEventListener('click', () => {
    commandAllSlaves('MINE');
  });

  document.getElementById('btn-slave-idle')!.addEventListener('click', () => {
    commandAllSlaves('IDLE');
  });

  // Keyboard Hotkeys: 'Digit1' (Wood), 'Digit2' (Stone), 'KeyB' (Place/Build)
  window.addEventListener('keydown', e => {
    if (e.code === 'Digit1') {
      const cur = getActiveBuildType();
      setActiveBuildType(cur === 'WOOD' ? null : 'WOOD');
      updateBuildButtons();
    } else if (e.code === 'Digit2') {
      const cur = getActiveBuildType();
      setActiveBuildType(cur === 'STONE' ? null : 'STONE');
      updateBuildButtons();
    } else if (e.code === 'KeyB') {
      onBuildClick?.();
    }
  });

  function updateBuildButtons() {
    const type = getActiveBuildType();
    btnWood.style.outline = type === 'WOOD' ? '2px solid #22c55e' : 'none';
    btnStone.style.outline = type === 'STONE' ? '2px solid #22c55e' : 'none';
  }
}