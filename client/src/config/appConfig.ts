// Server URL detection:
//
// Docker mode (served by nginx on port 8080):
//   Nginx proxies /socket.io/* → server container.
//   Socket.IO connects to the same origin — no port needed.
//   Detected when window.location.port is "8080" or VITE_SERVER_URL="same-origin".
//
// Dev mode (Vite on 5173, server on 3000):
//   Uses the page hostname + port 3000.
//
// LAN: friend opens http://192.168.x.x:8080 → same-origin proxy works automatically.

const port = window.location.port;

export const APP_CONFIG = {
  // In Docker / Nginx production, always use same-origin so Nginx proxies /socket.io/ to the game server.
  // In Vite dev mode (port 5173), direct connect to port 3000.
  SERVER_URL: import.meta.env['VITE_SERVER_URL']
    ?? (import.meta.env.PROD ? window.location.origin : (port === '5173' ? `http://${window.location.hostname}:3000` : window.location.origin)),
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
} as const;

