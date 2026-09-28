export type SelectableInfo = {
  id: string;
  name: string;
  hp: number;
  maxHP: number;
  team: 'blue' | 'red';
  type: 'unit' | 'building';
  subtype: string;
  attack?: number;
  defense?: number;
  count?: number;
};

export class SelectionManager {
  private selected: SelectableInfo[] = [];
  private panelEl: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private hpFillEl: HTMLElement | null = null;
  private buttonsEl: HTMLElement | null = null;

  constructor() {
    // Elements created by HUDManager; resolve lazily in renderPanel
    this.panelEl = document.getElementById('hud-bottom-center');
    this.nameEl = document.getElementById('selection-name');
    this.hpFillEl = document.getElementById('selection-hp');
    this.buttonsEl = document.getElementById('prod-buttons');
  }

  public selectUnit(info: SelectableInfo): void {
    this.selected = [info];
    this.renderPanel();
  }

  public selectGroup(infos: SelectableInfo[]): void {
    this.selected = infos;
    this.renderPanel();
  }

  public clearSelection(): void {
    this.selected = [];
    this.renderPanel();
  }

  private renderPanel(): void {
    // Lazy-resolve DOM elements in case HUDManager ran after this constructor
    if (!this.panelEl) this.panelEl = document.getElementById('hud-bottom-center');
    if (!this.nameEl) this.nameEl = document.getElementById('selection-name');
    if (!this.hpFillEl) this.hpFillEl = document.getElementById('selection-hp');
    if (!this.buttonsEl) this.buttonsEl = document.getElementById('prod-buttons');

    if (!this.panelEl) return;

    if (this.selected.length === 0) {
      this.panelEl.style.display = 'none';
      return;
    }

    this.panelEl.style.display = 'block';

    // Clear production buttons
    if (this.buttonsEl) this.buttonsEl.innerHTML = '';

    if (this.selected.length === 1) {
      const info = this.selected[0]!;
      let html = info.name;

      if (info.type === 'unit' && info.attack !== undefined && info.defense !== undefined) {
        html += ` <span style='font-size:11px; opacity:0.7; margin-left:8px;'>(Hücum: ${info.attack}, Müdafiə: ${info.defense})</span>`;
      }

      if (this.nameEl) this.nameEl.innerHTML = html;

      const pct = Math.max(0, Math.min(100, (info.hp / info.maxHP) * 100));
      if (this.hpFillEl) {
        this.hpFillEl.style.width = `${pct}%`;
        this.hpFillEl.style.background = pct > 50 ? '#3DDC84' : (pct > 25 ? '#F5C542' : '#FF3B3B');
      }

    } else {
      // Group selection
      const count = this.selected.length;
      if (this.nameEl) this.nameEl.textContent = `${count} vahid seçildi`;

      // Average HP for group
      const avgHP = this.selected.reduce((sum, item) => sum + (item.hp / item.maxHP), 0) / count;
      const pct = Math.max(0, Math.min(100, avgHP * 100));
      if (this.hpFillEl) {
        this.hpFillEl.style.width = `${pct}%`;
        this.hpFillEl.style.background = pct > 50 ? '#3DDC84' : (pct > 25 ? '#F5C542' : '#FF3B3B');
      }

      // Team summary
      const blueCount = this.selected.filter(s => s.team === 'blue').length;
      const redCount = this.selected.filter(s => s.team === 'red').length;

      let summary = '';
      if (blueCount > 0) summary += `<div style='color: #2F7BFF; display: inline-block; margin-right: 10px'>Mavi: ${blueCount}</div>`;
      if (redCount > 0) summary += `<div style='color: #FF3B3B; display: inline-block'>Qırmızı: ${redCount}</div>`;

      if (this.buttonsEl) {
        this.buttonsEl.innerHTML = `<div style='font-size: 12px; margin-top: 4px'>${summary}</div>`;
      }
    }
  }

  public getSelected(): SelectableInfo[] {
    return this.selected;
  }

  public hasSelection(): boolean {
    return this.selected.length > 0;
  }
}
