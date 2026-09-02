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
const isDockerOrProxy = port === '8080' || port === '80' || port === '';

// In Docker/nginx, Socket.IO is proxied at the same origin (/socket.io/)
// In dev, point to the server's port directly
const host = window.location.hostname;

export const APP_CONFIG = {
  SERVER_URL: import.meta.env['VITE_SERVER_URL']
    ?? (isDockerOrProxy ? window.location.origin : `http://${host}:3000`),
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
} as const;

