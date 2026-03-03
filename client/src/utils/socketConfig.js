import { io } from "socket.io-client";

// Get Socket.IO server URL from environment variable or fallback to localhost for development
// Extract base URL from API_URL if available, otherwise use default
const getSocketURL = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002/api";
  
  // If API_URL is set, extract the base URL (remove /api if present)
  if (API_URL.includes('/api')) {
    return API_URL.replace('/api', '');
  }
  
  // If it's a full URL, extract the origin
  try {
    const url = new URL(API_URL);
    return url.origin;
  } catch {
    // Fallback to default
    return "http://localhost:5002";
  }
};

export const SOCKET_URL = getSocketURL();

// Create and export socket connection function
export const createSocketConnection = (options = {}) => {
  return io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    ...options,
  });
};
