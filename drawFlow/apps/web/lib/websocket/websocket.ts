import { ServerMessage, ClientMessage } from "./types";
import { getUsername } from "../storage";

type MessageHandler = (message: ServerMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private currentRoomId: string | null = null;

  constructor() {
    // WebSocket server URL - adjust port if needed
    this.url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN && this.currentRoomId === roomId) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error("Connection already in progress"));
        return;
      }

      this.isConnecting = true;
      this.currentRoomId = roomId;

      try {
        // Connect without token (login-less service)
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Send join_room message immediately after connection with username
          const username = getUsername();
          this.send({ type: "join_room", roomId, username });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            this.handlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket connection error. Check if server is running on", this.url);
          this.isConnecting = false;
          // WebSocket error events don't have useful properties, create a proper error
          reject(new Error(`Failed to connect to WebSocket server at ${this.url}`));
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.isConnecting = false;
          this.ws = null;

          // Attempt to reconnect if we have a roomId
          if (this.currentRoomId && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
            setTimeout(() => {
              if (this.currentRoomId) {
                this.connect(this.currentRoomId).catch(console.error);
              }
            }, delay);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    this.currentRoomId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }

  send(message: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === (WebSocket.OPEN ?? false);
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
