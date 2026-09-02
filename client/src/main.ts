// Game bootstrapper — login flow + game loop.
// 1. Show login screen → user enters username → click OYNA
// 2. Connect to server, emit playerJoin(username)
// 3. Receive worldState, start game loop
// 4. Keep top-right player list (HUD) in sync

import { initCanvas } from './core/Canvas.js';
import { createGameLoop } from './core/GameLoop.js';
import { renderFrame } from './rendering/Renderer.js';
import { createGameClientState } from './state/gameClientState.js';
import { createMapObjects } from './map/mapObjects.factory.js';
import { createLocalPlayer, movePlayer } from './player/player.model.js';
import { initLocalPlayerController, getMovementInput } from './player/localPlayer.controller.js';
import { connectToServer, getSocket } from './network/socketClient.js';
import { initWorldSync } from './network/worldSync.js';
import { PLAYER_COLORS } from 'shared/constants/game.constants.js';
import { MAP_CONFIG } from './map/map.config.js';

// ─── DOM REFS ────────────────────────────────────────────────
const loginScreen    = document.getElementById('login-screen')!;
const usernameInput  = document.getElementById('username-input') as HTMLInputElement;
const playBtn        = document.getElementById('play-btn')!;
const statusEl       = document.getElementById('connection-status')!;
const playerListEl   = document.getElementById('player-list')!;

// ─── CANVAS + STATE ──────────────────────────────────────────
import { SceneManager } from './core/SceneManager.js';
const { ctx: uiCtx } = initCanvas('ui-canvas');
const sceneManager = new SceneManager('game-canvas');
const state   = createGameClientState();

// Load static map objects (overwritten by server sync once connected)
const mapObjects = createMapObjects();
state.trees   = mapObjects.trees;
state.brushes = mapObjects.brushes;
state.berries = mapObjects.berries;
state.waters  = mapObjects.waters;
state.stones  = mapObjects.stones;
state.castles = mapObjects.castles;
state.mapSize = MAP_CONFIG.mapSize;

// ─── INPUT ───────────────────────────────────────────────────
initLocalPlayerController();
// ─── PLAYER LIST HUD ─────────────────────────────────────────
function updatePlayerList(): void {
  const title = document.getElementById('player-list-title');
  const myId   = state.localPlayerId;
  const players = Object.values(state.players);

  // Remove all items but keep the title
  const items = playerListEl.querySelectorAll('.player-list-item');
  items.forEach(el => el.remove());

  // Update title count
  if (title) title.textContent = `🟢 Oyunçular (${players.length})`;

  // Render each player row
  for (const p of players) {
    const row = document.createElement('div');
    row.className = 'player-list-item';

    const dot = document.createElement('div');
    dot.className = 'player-list-dot';
    dot.style.background = p.color;

    const name = document.createElement('div');
    name.className = 'player-list-name' + (p.id === myId ? ' is-me' : '');
    name.textContent = (p.id === myId ? '★ ' : '') + (p.name || p.id.slice(0, 8));

    row.appendChild(dot);
    row.appendChild(name);
    playerListEl.appendChild(row);
  }
}

// ─── OFFLINE / PRE-LOGIN LOCAL PLAYER ────────────────────────
const LOCAL_ID = 'local';
const localPlayer = createLocalPlayer(LOCAL_ID, { x: 400, y: 400 }, PLAYER_COLORS[0] ?? '#e63946');
localPlayer.name = 'Siz';
state.players[LOCAL_ID] = localPlayer;
state.localPlayerId = LOCAL_ID;

// ─── SOCKET (created before game loop so it can be referenced in tick) ──────
const socket = connectToServer();

socket.on('connect', () => {
  setStatus('connected', `Online (${socket.id?.slice(0, 6)})`);
});

socket.on('disconnect', () => {
  setStatus('disconnected', 'Bağlantı kəsildi');
});

// Game loop (starts immediately so the map renders while the login screen is shown)
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

  renderFrame(sceneManager, state, uiCtx, globalTime);

});
loop.start();

// Sync server state → local state, then update HUD on every relevant event
initWorldSync(socket, state);
socket.on('worldState',   () => updatePlayerList());
socket.on('playerJoined', () => updatePlayerList());
socket.on('playerLeft',   () => updatePlayerList());


// ─── LOGIN FLOW ───────────────────────────────────────────────
function startGame(username: string): void {
  // Hide login screen
  loginScreen.style.display = 'none';

  // Remove offline placeholder
  delete state.players[LOCAL_ID];
  state.localPlayerId = null;

  // Wait for socket connect then send name
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

// Play button
playBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim() || 'Oyunçu';
  startGame(name);
});

// Enter key on input
usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const name = usernameInput.value.trim() || 'Oyunçu';
    startGame(name);
  }
});

// ─── HELPERS ─────────────────────────────────────────────────
function setStatus(cls: 'connected' | 'disconnected', text: string): void {
  statusEl.textContent = text;
  statusEl.className = cls;
}
