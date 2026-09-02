# .io Game — Modular LAN Multiplayer MVP

A browser-based, top-down, square-map, `.io`-style multiplayer strategy/survival game.
Built for maximum modularity: every entity is isolated so a future AI session can safely extend one module without touching others.

## Architecture Overview

The codebase follows a strict **module boundary** philosophy:

- `shared/` — TypeScript interfaces and constants. The single source of truth.
- `server/` — Authoritative game logic. Owns `GameWorldState`, runs at fixed tick rate.
- `client/` — Rendering and input only. Never implements authoritative logic.

Dependency direction: `shared → server`, `shared → client`. Never circular.

## Folder Structure

```
io-game/
├── assets/          PNG-ready asset folders (drop PNGs here, zero code changes)
├── shared/          Shared TypeScript types and constants
├── server/          Node.js + Socket.IO authoritative server
├── client/          Vite + Canvas 2D browser client
└── docs/            Architecture notes
```

## Install

```bash
pnpm install
```

## Run the Server

```bash
pnpm --filter server dev
```

## Run the Client

```bash
pnpm --filter client dev -- --host
```

The `--host` flag exposes the Vite dev server on your LAN so other computers can connect.

## LAN Multiplayer Setup

1. Start the server on Computer A.
2. Find Computer A's LAN IP: `ipconfig` (Windows) or `ip addr` (Linux/Mac).
3. On Computer B, edit `client/src/config/appConfig.ts`:
   ```ts
   SERVER_URL: 'http://192.168.1.42:3000', // replace with Computer A's IP
   ```
4. Run the client on Computer B with `pnpm --filter client dev`.

Alternatively, set the `VITE_SERVER_URL` environment variable.

## Adding Assets

Drop a PNG into the right folder. No code changes needed.

```
assets/
  trees/oak.png       → auto-picked up for tree rendering
  stones/granite.png  → auto-picked up for stone rendering
  gold/nugget.png     → auto-picked up for gold rendering
  ...
```

The `AssetLoader.ts` module attempts to load `assets/{category}/{id}.png` on startup.
If the file is missing, the entity falls back to a procedural shape.

## Modifying the Map

Edit only `client/src/map/map.config.ts` (and `server/src/map/mapData.server.ts` to keep server in sync).
Change object positions, add new spawn points, adjust map size — no other files need to change.

## Adding a New Entity Type

1. Create `client/src/entities/{name}/` with:
   - `{name}.config.ts` — sizes, colors, tunable constants
   - `{name}.model.ts` — data shape (re-export from `shared/types/entities.ts`)
   - `{name}.renderer.ts` — `draw{Name}(ctx, camera, entity, w, h)` function
2. Add the state interface to `shared/types/entities.ts`.
3. Add an array to `GameWorldState` in `shared/types/entities.ts`.
4. Register spawn positions in `map.config.ts` and `mapData.server.ts`.
5. Call `draw{Name}` from `client/src/rendering/Renderer.ts`.
6. Add an empty folder to `assets/{name}/` for future PNGs.

## Core Architecture Rules

- No monolithic files — every concern has its own module.
- `*.model.ts` = data/logic only. `*.renderer.ts` = drawing only. `*.config.ts` = constants only.
- No circular imports. No magic numbers. No hardcoded asset paths.
- Server is authoritative. Client only sends inputs and renders received state.
- Public interfaces define module contracts — never reach into module internals.
