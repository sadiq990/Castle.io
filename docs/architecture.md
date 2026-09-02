# Architecture: Module Boundaries

## Dependency Flow

```
shared/types/  ──→  server/src/
               ──→  client/src/
```

No arrows go the other way. `server/` never imports `client/`. `client/` never imports `server/`.

## Layer Responsibilities

| Layer | Owns | Never does |
|---|---|---|
| `shared/` | Type contracts, game constants | Any runtime logic |
| `server/` | World state, movement math, player lifecycle | Rendering, asset loading |
| `client/` | Canvas rendering, input, camera | Authoritative game logic |

## Entity Module Pattern

Every entity follows this 3-file pattern:

```
{entity}/
  {entity}.model.ts     — data shape + pure helper functions
  {entity}.renderer.ts  — draw*(ctx, camera, state, w, h) — reads only
  {entity}.config.ts    — all constants, never inlined elsewhere
```

Renderers are pure functions: same inputs → same pixels. No side effects.

## Network Flow

```
Client keyboard → getMovementInput() → socket.emit('playerMove')
                                           ↓
                                    Server eventHandlers.ts
                                           ↓
                                    GameWorld.queueInput()
                                           ↓
                                    Tick: applyMovementInput()
                                           ↓
                                    io.emit('worldState')
                                           ↓
                                    Client worldSync.ts → state
                                           ↓
                                    renderFrame()
```

## Future Extension Points

- **Gathering**: Add optional `health` fields to `TreeState`/`StoneState` in `shared/types/entities.ts`, implement logic in `server/src/entities/tree/`, add interaction event in `shared/types/network.ts`.
- **New entity**: Follow the 3-file entity pattern, register in map config, add to `Renderer.ts`.
- **Sprite rendering**: Replace fallback draw calls in `*.renderer.ts` with image draws — `AssetLoader.resolveAsset()` already returns the loaded image.
- **Procedural map**: Implement the `MapGenerator` interface in `worldFactory.ts` — the factory pattern already supports it.
