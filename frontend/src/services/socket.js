import { io } from 'socket.io-client';

/**
 * Dynamically resolves the backend WebSocket target:
 * - When running in Vite Dev Mode (port 5173), directly connect to backend on port 3000
 * - In production or unified build, connects to the same origin
 */
const resolveBackendUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  
  // If Vite dev server is on port 5173
  if (window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  
  return window.location.origin;
};

const socket = io(resolveBackendUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

socket.on('connect_error', (error) => {
  // Graceful silent auto-reconnect without throwing unhandled exceptions
});

export default socket;
