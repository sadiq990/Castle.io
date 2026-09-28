import type { GameClientState } from '../state/gameClientState.js';

export type HUDResources = {
  wood: number;
  gold: number;
  stone: number;
  food: number;
  population: number;
  maxPopulation: number;
};

export type EventLogEntry = {
  text: string;
  type: 'info' | 'important' | 'success';
  timestamp: number;
};

export class HUDManager {
  private elements: Map<string, HTMLElement> = new Map();
  private eventLog: EventLogEntry[] = [];
  private gameStartTime: number;

  constructor() {
    this.createHUDElements();
    this.gameStartTime = Date.now();
    setInterval(() => this.updateGameTimer(), 1000);
  }

  private createHUDElements(): void {
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/ui/hud.css';
    document.head.appendChild(link);

    // 1. Top Center Panel
    const topCenter = document.createElement('div');
    topCenter.id = 'hud-top-center';
    topCenter.className = 'hud-panel';
    topCenter.innerHTML = `
      <div class='score-block'>
        <div class='score-team-name' style='color:#2F7BFF'>MAVİ</div>
        <div id='score-blue' class='score-value' style='color:#2F7BFF'>0</div>
      </div>
      <div>
        <div id='target-display' class='target-display'>HƏDƏF: 3</div>
        <div id='game-timer' class='game-timer'>00:00</div>
      </div>
      <div class='score-block'>
        <div class='score-team-name' style='color:#FF3B3B'>QIRMIZI</div>
        <div id='score-red' class='score-value' style='color:#FF3B3B'>0</div>
      </div>
      <div class='score-separator'>|</div>
      <div id='flag-status' class='flag-status'></div>
    `;
    document.body.appendChild(topCenter);
    this.elements.set('score-blue', document.getElementById('score-blue')!);
    this.elements.set('score-red', document.getElementById('score-red')!);
    this.elements.set('target-display', document.getElementById('target-display')!);
    this.elements.set('game-timer', document.getElementById('game-timer')!);
    this.elements.set('flag-status', document.getElementById('flag-status')!);

    // 2. Top Left Panel (Resources)
    const topLeft = document.createElement('div');
    topLeft.id = 'hud-top-left';
    topLeft.className = 'hud-panel';
    topLeft.innerHTML = `
      <div id='resource-display' class='resource-row'></div>
      <div id='population-display' class='population-row'></div>
    `;
    document.body.appendChild(topLeft);
    this.elements.set('resource-display', document.getElementById('resource-display')!);
    this.elements.set('population-display', document.getElementById('population-display')!);

    // 3. Bottom Center Panel (Selection)
    const bottomCenter = document.createElement('div');
    bottomCenter.id = 'hud-bottom-center';
    bottomCenter.className = 'hud-panel';
    bottomCenter.style.display = 'none';
    bottomCenter.innerHTML = `
      <div id='selection-name' class='selection-title'></div>
      <div class='selection-hp-bar'>
        <div id='selection-hp' class='selection-hp-fill'></div>
      </div>
      <div id='prod-buttons' class='production-buttons'></div>
      <div id='prod-queue' class='production-queue'></div>
    `;
    document.body.appendChild(bottomCenter);
    this.elements.set('hud-bottom-center', bottomCenter);
    this.elements.set('selection-name', document.getElementById('selection-name')!);
    this.elements.set('selection-hp', document.getElementById('selection-hp')!);
    this.elements.set('prod-buttons', document.getElementById('prod-buttons')!);
    this.elements.set('prod-queue', document.getElementById('prod-queue')!);

    // 4. Bottom Left Panel (Event Log)
    const bottomLeft = document.createElement('div');
    bottomLeft.id = 'hud-bottom-left';
    document.body.appendChild(bottomLeft);
    this.elements.set('hud-bottom-left', bottomLeft);

    // 5. Warning Banner
    const warningBanner = document.createElement('div');
    warningBanner.id = 'hud-warning-banner';
    warningBanner.style.display = 'none';
    warningBanner.innerHTML = `<div class='warning-banner' id='warning-banner-text'></div>`;
    document.body.appendChild(warningBanner);
    this.elements.set('hud-warning-banner', warningBanner);
    this.elements.set('warning-banner-text', document.getElementById('warning-banner-text')!);

    // 6. & 7. Screen Edge Glows
    const redGlow = document.createElement('div');
    redGlow.className = 'screen-edge-red-glow';
    redGlow.style.opacity = '0';
    document.body.appendChild(redGlow);
    this.elements.set('screen-edge-red-glow', redGlow);

    const blueGlow = document.createElement('div');
    blueGlow.className = 'screen-edge-blue-glow';
    blueGlow.style.opacity = '0';
    document.body.appendChild(blueGlow);
    this.elements.set('screen-edge-blue-glow', blueGlow);

    // 8. Minimap
    const minimap = document.createElement('div');
    minimap.id = 'minimap-container';
    document.body.appendChild(minimap);
    this.elements.set('minimap-container', minimap);

    // 9. Drag Select Box
    const dragBox = document.createElement('div');
    dragBox.id = 'drag-select-box';
    dragBox.style.display = 'none';
    document.body.appendChild(dragBox);
    this.elements.set('drag-select-box', dragBox);
  }

  public updateScores(scores: { blue: number; red: number }, targetScore: number): void {
    const blueEl = this.elements.get('score-blue');
    const redEl = this.elements.get('score-red');
    const targetEl = this.elements.get('target-display');
    if (blueEl) blueEl.textContent = scores.blue.toString();
    if (redEl) redEl.textContent = scores.red.toString();
    if (targetEl) targetEl.textContent = `HƏDƏF: ${targetScore}`;
  }

  public updateFlagStatus(ctf: GameClientState['ctf']): void {
    const statusEl = this.elements.get('flag-status');
    if (!statusEl) return;

    const translate = (status: string): string => {
      if (status === 'AT_HOME') return 'Qalada';
      if (status === 'CARRIED') return 'Daşınır ⚡';
      if (status === 'DROPPED') return 'Yerə düşüb ⚠';
      return status;
    };

    const flagColorFor = (status: string, team: 'blue' | 'red'): string => {
      if (status === 'AT_HOME') return team === 'blue' ? '#2F7BFF' : '#FF3B3B';
      if (status === 'CARRIED') return '#FF5A4F';
      return '#F5C542';
    };

    let html = '';
    if (ctf.flags.blue) {
      const flag = ctf.flags.blue;
      const color = flagColorFor(flag.status, 'blue');
      html += `
        <div class='flag-status-item'>
          <div class='flag-dot' style='background: ${color}'></div>
          <span>Mavi Bayraq: ${translate(flag.status)}</span>
        </div>
      `;
    }
    if (ctf.flags.red) {
      const flag = ctf.flags.red;
      const color = flagColorFor(flag.status, 'red');
      html += `
        <div class='flag-status-item'>
          <div class='flag-dot' style='background: ${color}'></div>
          <span>Qırmızı Bayraq: ${translate(flag.status)}</span>
        </div>
      `;
    }
    statusEl.innerHTML = html;
  }

  public updateResources(res: HUDResources): void {
    const resEl = this.elements.get('resource-display');
    const popEl = this.elements.get('population-display');
    if (resEl) {
      resEl.innerHTML = `
        <div class='resource-item'><span class='resource-icon'>🪵</span><span class='resource-value'>${res.wood}</span></div>
        <div class='resource-item'><span class='resource-icon'>🪙</span><span class='resource-value'>${res.gold}</span></div>
        <div class='resource-item'><span class='resource-icon'>🪨</span><span class='resource-value'>${res.stone}</span></div>
        <div class='resource-item'><span class='resource-icon'>🍖</span><span class='resource-value'>${res.food}</span></div>
      `;
    }
    if (popEl) {
      popEl.innerHTML = `👥 Əhali ${res.population}/${res.maxPopulation}`;
    }
  }

  public updateGameTimer(): void {
    const timerEl = this.elements.get('game-timer');
    if (!timerEl) return;
    const diff = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const m = Math.floor(diff / 60).toString().padStart(2, '0');
    const s = (diff % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }

  public showSelectionPanel(info: { name: string; hp: number; maxHP: number; team?: 'blue' | 'red' } | null): void {
    const panel = this.elements.get('hud-bottom-center');
    if (!panel) return;

    if (info === null) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';

    const nameEl = this.elements.get('selection-name');
    const hpEl = this.elements.get('selection-hp');
    if (nameEl) nameEl.textContent = info.name;
    if (hpEl) {
      const pct = Math.max(0, Math.min(100, (info.hp / info.maxHP) * 100));
      hpEl.style.width = `${pct}%`;
      hpEl.style.background = pct > 50 ? '#3DDC84' : (pct > 25 ? '#F5C542' : '#FF3B3B');
    }
  }

  public setProductionButtons(buttons: Array<{ icon: string; label: string; cost: string; shortcut: string; onClick: () => void; disabled?: boolean }>): void {
    const container = this.elements.get('prod-buttons');
    if (!container) return;
    container.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'prod-btn';
      if (b.disabled) btn.disabled = true;
      btn.innerHTML = `
        <span class='shortcut'>${b.shortcut}</span>
        <span style='font-size: 16px; margin-bottom: 2px'>${b.icon}</span>
        <span>${b.label}</span>
        <span class='cost'>${b.cost}</span>
      `;
      btn.onclick = () => {
        if (!btn.disabled) b.onClick();
      };
      container.appendChild(btn);
    });
  }

  public showWarning(text: string, direction?: 'left' | 'right' | 'up' | 'down'): void {
    const banner = this.elements.get('hud-warning-banner');
    const textEl = this.elements.get('warning-banner-text');
    if (banner && textEl) {
      banner.style.display = 'block';
      textEl.textContent = text + (direction ? ` (Yön: ${direction})` : '');
      setTimeout(() => this.hideWarning(), 4000);
    }
  }

  public hideWarning(): void {
    const banner = this.elements.get('hud-warning-banner');
    if (banner) banner.style.display = 'none';
  }

  public showScreenEdgeGlow(team: 'blue' | 'red', duration: number = 2000): void {
    const glow = this.elements.get(`screen-edge-${team}-glow`);
    if (glow) {
      glow.style.opacity = '1';
      setTimeout(() => { glow.style.opacity = '0'; }, duration);
    }
  }

  public addEventLogEntry(text: string, type: 'info' | 'important' | 'success'): void {
    const log = this.elements.get('hud-bottom-left');
    if (!log) return;
    const div = document.createElement('div');
    div.className = `event-entry ${type}`;
    div.textContent = text;
    log.insertBefore(div, log.firstChild);

    while (log.children.length > 5) {
      log.removeChild(log.lastChild!);
    }

    setTimeout(() => {
      if (log.contains(div)) {
        div.style.opacity = '0';
        setTimeout(() => { if (log.contains(div)) log.removeChild(div); }, 300);
      }
    }, 8000);
  }

  public showDragSelectBox(x1: number, y1: number, x2: number, y2: number): void {
    const box = this.elements.get('drag-select-box');
    if (!box) return;
    box.style.display = 'block';
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y1 - y2);
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }

  public hideDragSelectBox(): void {
    const box = this.elements.get('drag-select-box');
    if (box) box.style.display = 'none';
  }

  public update(state: GameClientState, resources: HUDResources): void {
    // targetScore is 3 by default (capture 3 flags to win)
    this.updateScores(state.ctf.scores, 3);
    this.updateFlagStatus(state.ctf);
    this.updateResources(resources);
    // timer is updated via setInterval
  }
}
