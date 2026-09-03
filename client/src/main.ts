// Game bootstrapper — login flow + game loop + CTF Flag Mode.

import { initCanvas } from './core/Canvas.js';
import { createGameLoop } from './core/GameLoop.js';
import { renderFrame } from './rendering/Renderer.js';
import { createGameClientState } from './state/gameClientState.js';
import { createMapObjects } from './map/mapObjects.factory.js';
import { createLocalPlayer, movePlayer } from './player/player.model.js';
import { initLocalPlayerController, getMovementInput } from './player/localPlayer.controller.js';
import { connectToServer, getSocket } from './network/socketClient.js';
import { initWorldSync } from './network/worldSync.js';
import { MAP_CONFIG } from './map/map.config.js';
import { initFlagUI, updateFlagUI, showCTFToast } from './ui/flagUI.js';
import { initResourceUI, isTowerBuildMode } from './ui/resourceUI.js';
import { initSlaves } from './slaves/SlaveManager.js';
import { attemptBuildFenceAt, attemptAttackFence, setSceneManagerForFences, getActiveBuildType, updateGhostPreview } from './fences/FenceManager.js';
import { attemptBuildTower } from './towers/TowerManager.js';

// ─── DOM REFS ────────────────────────────────────────────────
const loginScreen    = document.getElementById('login-screen')!;
const usernameInput  = document.getElementById('username-input') as HTMLInputElement;
const playBtn        = document.getElementById('play-btn')!;
const statusEl       = document.getElementById('connection-status')!;
const playerListEl   = document.getElementById('player-list')!;

// ─── CANVAS + SCENE + STATE ──────────────────────────────────
import { SceneManager } from './core/SceneManager.js';
const { ctx: uiCtx } = initCanvas('ui-canvas');
const sceneManager = new SceneManager('game-canvas');
const state = createGameClientState();

// Initialize CTF Top Scoreboard, Status Badges & Toasts
initFlagUI();

// Initialize Fence Manager & Resource UI
setSceneManagerForFences(sceneManager);

let mouseScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('mousemove', e => {
  mouseScreen.x = e.clientX;
  mouseScreen.y = e.clientY;
});

const handleBuild = () => {
  const myPlayer = (state.localPlayerId && state.players[state.localPlayerId]) ? state.players[state.localPlayerId] : localPlayer;
  if (!myPlayer) return;

  const hit = sceneManager.getGroundIntersection(mouseScreen.x, mouseScreen.y);
  const targetPos = hit ? { x: hit.x, y: hit.z } : {
    x: myPlayer.position.x + Math.cos(myPlayer.facing ?? 0) * 45,
    y: myPlayer.position.y + Math.sin(myPlayer.facing ?? 0) * 45,
  };

  if (isTowerBuildMode()) {
    attemptBuildTower(sceneManager, targetPos, myPlayer.team);
  } else if (getActiveBuildType()) {
    attemptBuildFenceAt(sceneManager, targetPos, myPlayer.team);
  }
};
initResourceUI(handleBuild);

// Canvas Direct Left-Click Handler (Build at cursor OR Attack in game)
const gameCanvas = document.getElementById('game-canvas');
gameCanvas?.addEventListener('mousedown', (e) => {
  if (e.button === 0) { // Primary / Left Click
    const myPlayer = (state.localPlayerId && state.players[state.localPlayerId]) ? state.players[state.localPlayerId] : localPlayer;
    if (!myPlayer) return;

    const hit = sceneManager.getGroundIntersection(e.clientX, e.clientY);
    const clickGroundPos = hit ? { x: hit.x, y: hit.z } : null;

    if (isTowerBuildMode() && clickGroundPos) {
      attemptBuildTower(sceneManager, clickGroundPos, myPlayer.team);
      return;
    } else if (getActiveBuildType() && clickGroundPos) {
      attemptBuildFenceAt(sceneManager, clickGroundPos, myPlayer.team);
      return;
    }

    // Normal In-Game Attack (hit enemy fence, knock enemy flag)
    attemptAttackFence(sceneManager, myPlayer.position, myPlayer.team, myPlayer.hasFlag);
    socket.emit('playerAttack');
  }
});

// Load static map objects
const mapObjects = createMapObjects();
state.trees     = mapObjects.trees;
state.brushes   = mapObjects.brushes;
state.berries   = mapObjects.berries;
state.mountains = mapObjects.mountains;
state.waters    = mapObjects.waters;
state.stones    = mapObjects.stones;
state.castles   = mapObjects.castles;
state.mapSize   = MAP_CONFIG.mapSize;

// ─── SOCKET ──────────────────────────────────────────────────
const socket = connectToServer();

// ─── INPUT (Movement & Spacebar Attack) ───────────────────────
initLocalPlayerController(() => {
  const myPlayer = (state.localPlayerId && state.players[state.localPlayerId]) ? state.players[state.localPlayerId] : localPlayer;
  if (!myPlayer) return;

  // Spacebar Attack
  attemptAttackFence(sceneManager, myPlayer.position, myPlayer.team, myPlayer.hasFlag);
  socket.emit('playerAttack');
});

// ─── PLAYER LIST HUD ─────────────────────────────────────────
function updatePlayerList(): void {
  const title = document.getElementById('player-list-title');
  const myId = state.localPlayerId;
  const players = Object.values(state.players);

  const items = playerListEl.querySelectorAll('.player-list-item');
  items.forEach(el => el.remove());

  if (title) title.textContent = `🟢 Oyunçular (${players.length})`;

  for (const p of players) {
    const row = document.createElement('div');
    row.className = 'player-list-item';

    const dot = document.createElement('div');
    dot.className = 'player-list-dot';
    dot.style.background = p.team === 'red' ? '#EF4444' : '#3B82F6';

    const name = document.createElement('div');
    name.className = 'player-list-name' + (p.id === myId ? ' is-me' : '');
    const flagTag = p.hasFlag ? ' 🚩' : '';
    name.textContent = (p.id === myId ? '★ ' : '') + (p.name || p.id.slice(0, 8)) + flagTag;

    row.appendChild(dot);
    row.appendChild(name);
    playerListEl.appendChild(row);
  }
}

// ─── OFFLINE LOCAL PLAYER ────────────────────────────────────
const LOCAL_ID = 'local';
const localPlayer = createLocalPlayer(LOCAL_ID, { x: 400, y: 400 }, '#2E6FE0');
localPlayer.name = 'Siz';
state.players[LOCAL_ID] = localPlayer;
state.localPlayerId = LOCAL_ID;

socket.on('connect', () => {
  setStatus('connected', `Online (${socket.id?.slice(0, 6)})`);
});

socket.on('disconnect', () => {
  setStatus('disconnected', 'Bağlantı kəsildi');
});

// CTF Global Toast Notifications
socket.on('flagNotification', (data: { text: string; color: string }) => {
  showCTFToast(data.text, data.color);
});

// ─── GAME LOOP ───────────────────────────────────────────────
let globalTime = 0;
const loop = createGameLoop((dt) => {
  globalTime += dt;
  const input = getMovementInput();
  const isConnected = getSocket()?.connected ?? false;

  if (!isConnected) {
    movePlayer(localPlayer, input.dx, input.dy, dt, state.mapSize);
    state.players[LOCAL_ID] = localPlayer;
    sceneManager.setCameraTarget(localPlayer.position);
  } else {
    socket.emit('playerMove', input);
    const myId = state.localPlayerId;
    const myPlayer = myId ? state.players[myId] : undefined;
    if (myPlayer) sceneManager.setCameraTarget(myPlayer.position);
  }

  // Live Holographic Ghost Preview on Ground
  const groundHit = sceneManager.getGroundIntersection(mouseScreen.x, mouseScreen.y);
  const mouseGroundPos = groundHit ? { x: groundHit.x, y: groundHit.z } : null;
  const myP = (state.localPlayerId && state.players[state.localPlayerId]) ? state.players[state.localPlayerId] : localPlayer;
  updateGhostPreview(sceneManager, mouseGroundPos, myP?.team ?? 'blue', isTowerBuildMode());

  // Render 3D World & UI
  renderFrame(sceneManager, state, uiCtx, globalTime);

  // Update CTF HUD
  updateFlagUI(state);
});
loop.start();

// Initialize 10 Slaves for player team
initSlaves(sceneManager, 'blue');

// World Sync
initWorldSync(socket, state);
socket.on('worldState',   () => updatePlayerList());
socket.on('playerJoined', p => {
  updatePlayerList();
  if (p.id === state.localPlayerId) {
    initSlaves(sceneManager, p.team);
  }
});
socket.on('playerLeft',   () => updatePlayerList());

// ─── LOGIN FLOW ───────────────────────────────────────────────
function startGame(username: string): void {
  loginScreen.style.display = 'none';

  delete state.players[LOCAL_ID];
  state.localPlayerId = null;

  function doJoin(): void {
    const myId = socket.id;
    if (!myId) return;

    state.localPlayerId = myId;
    socket.emit('playerJoin', username);
    setStatus('connected', `Online (${myId.slice(0, 6)})`);
  }

  if (socket.connected) {
    doJoin();
  } else {
    socket.once('connect', doJoin);
  }
}

playBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim() || 'Oyunçu';
  startGame(name);
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = usernameInput.value.trim() || 'Oyunçu';
    startGame(name);
  }
});

function setStatus(cls: 'connected' | 'disconnected', text: string): void {
  statusEl.textContent = text;
  statusEl.className = cls;
}