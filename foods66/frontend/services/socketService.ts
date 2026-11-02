import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from './apiClient';
import { getToken } from './authService';

const SOCKET_URL = getBaseUrl();

class SocketService {
  private socket: Socket | null = null;

  connect(userId?: string) {
    const token = getToken();

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        auth: {
          token: token || undefined,
        },
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to Foods66 Real-time Socket Server');
        if (userId) {
          this.socket?.emit('join', userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('⚠️ Disconnected from Socket Server');
      });
    } else if (userId) {
      this.socket.emit('join', userId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTracking(orderId: string) {
    if (!this.socket) return;
    this.socket.emit('join_tracking', orderId);
  }

  leaveTracking(orderId: string) {
    if (!this.socket) return;
    this.socket.emit('leave_tracking', orderId);
  }

  emitDriverLocation(data: { orderId: string, latitude: number, longitude: number, accuracy?: number, heading?: number, speed?: number, timestamp?: number }) {
    if (!this.socket) return;
    this.socket.emit('driver:location:update', data);
  }

  // Event Subscriptions
  onNotification(callback: (data: any) => void) {
    this.socket?.on('notification', callback);
  }

  offNotification(callback: (data: any) => void) {
    this.socket?.off('notification', callback);
  }

  onOrderStatus(callback: (data: any) => void) {
    this.socket?.on('order:status', callback);
  }

  offOrderStatus(callback: (data: any) => void) {
    this.socket?.off('order:status', callback);
  }

  onDeliveryAssigned(callback: (data: any) => void) {
    this.socket?.on('delivery:assigned', callback);
  }

  offDeliveryAssigned(callback: (data: any) => void) {
    this.socket?.off('delivery:assigned', callback);
  }

  onDeliveryPickedUp(callback: (data: any) => void) {
    this.socket?.on('delivery:picked_up', callback);
  }

  offDeliveryPickedUp(callback: (data: any) => void) {
    this.socket?.off('delivery:picked_up', callback);
  }

  onDeliveryOutForDelivery(callback: (data: any) => void) {
    this.socket?.on('delivery:out_for_delivery', callback);
  }

  offDeliveryOutForDelivery(callback: (data: any) => void) {
    this.socket?.off('delivery:out_for_delivery', callback);
  }

  onDeliveryLocation(callback: (data: any) => void) {
    this.socket?.on('delivery:location', callback);
  }

  offDeliveryLocation(callback: (data: any) => void) {
    this.socket?.off('delivery:location', callback);
  }

  onOrderDelivered(callback: (data: any) => void) {
    this.socket?.on('order:delivered', callback);
  }

  offOrderDelivered(callback: (data: any) => void) {
    this.socket?.off('order:delivered', callback);
  }
}

export const socketService = new SocketService();
