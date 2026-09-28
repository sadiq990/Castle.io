import type { GameClientState } from '../state/gameClientState.js';

export class MinimapRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private mapSize: number;
    private onClickHandler: ((worldX: number, worldZ: number) => void) | null = null;

    constructor(canvasOrContainerId: string, size: number = 160) {
        let element = document.getElementById(canvasOrContainerId);
        if (element instanceof HTMLCanvasElement) {
            this.canvas = element;
        } else if (element) {
            this.canvas = document.createElement('canvas');
            element.appendChild(this.canvas);
        } else {
            this.canvas = document.createElement('canvas');
            document.body.appendChild(this.canvas);
        }

        this.canvas.width = size;
        this.canvas.height = size;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;
        this.mapSize = 4500;

        this.canvas.addEventListener('click', (e) => {
            if (!this.onClickHandler) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const worldX = (x / this.canvas.width) * this.mapSize;
            const worldZ = (y / this.canvas.height) * this.mapSize;
            this.onClickHandler(worldX, worldZ);
        });
    }

    private worldToMinimap(wx: number, wz: number): { x: number, y: number } {
        return {
            x: (wx / this.mapSize) * this.canvas.width,
            y: (wz / this.mapSize) * this.canvas.height
        };
    }

    private isNearLake(wx: number, wz: number): boolean {
        const dx1 = wx - 1300;
        const dz1 = wz - 1600;
        if (Math.sqrt(dx1 * dx1 + dz1 * dz1) <= 290) return true;

        const dx2 = wx - 3200;
        const dz2 = wz - 2900;
        if (Math.sqrt(dx2 * dx2 + dz2 * dz2) <= 310) return true;

        return false;
    }

    render(state: GameClientState, cameraPos: { x: number, z: number }, viewportW: number, viewportH: number): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // 1. Background
        ctx.fillStyle = '#2A4A1A';
        ctx.fillRect(0, 0, w, h);

        // 2. Draw lakes
        const lakes = [
            { wx: 1300, wz: 1600, wr: 290 },
            { wx: 3200, wz: 2900, wr: 310 }
        ];
        lakes.forEach(lake => {
            const pos = this.worldToMinimap(lake.wx, lake.wz);
            const r = (lake.wr / this.mapSize) * w;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fillStyle = '#0B4FA8';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = '#8FD3F4';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 3. Draw road path
        ctx.beginPath();
        const p1 = this.worldToMinimap(700, 700);
        const p2 = this.worldToMinimap(2250, 2250);
        const p3 = this.worldToMinimap(3800, 3800);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.strokeStyle = '#B89A6A';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 4. Draw castle territories
        const t1 = this.worldToMinimap(700, 700);
        ctx.beginPath();
        ctx.arc(t1.x, t1.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(47,123,255,0.2)';
        ctx.fill();

        const t2 = this.worldToMinimap(3800, 3800);
        ctx.beginPath();
        ctx.arc(t2.x, t2.y, 50, 0, Math.PI * 2); 
        ctx.fillStyle = 'rgba(255,47,47,0.2)';
        ctx.fill();

        // 5. Draw castles
        ctx.fillStyle = 'blue';
        ctx.fillRect(t1.x - 4, t1.y - 4, 8, 8);
        ctx.fillStyle = 'red';
        ctx.fillRect(t2.x - 4, t2.y - 4, 8, 8);

        // 6. Draw shrine
        const shrine = this.worldToMinimap(2250, 2250);
        ctx.beginPath();
        ctx.moveTo(shrine.x, shrine.y - 4);
        ctx.lineTo(shrine.x + 4, shrine.y);
        ctx.lineTo(shrine.x, shrine.y + 4);
        ctx.lineTo(shrine.x - 4, shrine.y);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();

        // 7. Draw flags
        if (state.ctf && state.ctf.flags) {
            for (const flag of Object.values(state.ctf.flags)) {
                const pos = this.worldToMinimap(flag.position.x, flag.position.y);
                if (flag.status === 'AT_HOME') {
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = flag.team === 'blue' ? 'blue' : 'red';
                    ctx.fill();
                } else if (flag.status === 'CARRIED') {
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 255, 0, ' + (0.5 + Math.sin(Date.now() / 150) * 0.5) + ')';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.font = '10px Arial';
                    ctx.fillText('🚩', pos.x - 5, pos.y + 3);
                } else if (flag.status === 'DROPPED') {
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = 'yellow';
                    ctx.fill();
                }
            }
        }

        // 8. Draw units/players
        if (state.players) {
            for (const id in state.players) {
                const player = state.players[id]!;
                const pos = this.worldToMinimap(player.position.x, player.position.y);
                const isLocal = id === state.localPlayerId;
                
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, isLocal ? 4 : 3, 0, Math.PI * 2);
                ctx.fillStyle = isLocal ? 'white' : (player.team === 'blue' ? 'blue' : 'red');
                ctx.fill();

                if (isLocal) {
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // 9. Draw viewport rectangle
        const camPos = this.worldToMinimap(cameraPos.x, cameraPos.z);
        const vw = (viewportW / this.mapSize) * w;
        const vh = (viewportH / this.mapSize) * h;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(camPos.x - vw / 2, camPos.y - vh / 2, vw, vh);

        // 10. Border
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(1, 1, w - 2, h - 2, 4);
            ctx.stroke();
        } else {
            ctx.strokeRect(1, 1, w - 2, h - 2);
        }

        // 11. Corner labels
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '8px sans-serif';
        ctx.fillText('MAVİ', 4, 10);
        const redWidth = ctx.measureText('QIRMIZI').width;
        ctx.fillText('QIRMIZI', w - redWidth - 4, h - 4);
    }

    onClick(callback: (worldX: number, worldZ: number) => void): void {
        this.onClickHandler = callback;
    }
}
