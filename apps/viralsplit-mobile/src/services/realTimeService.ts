import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ProcessingUpdate {
  project_id: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  stage?: string;
  viral_score?: number;
  transformations?: Record<string, string>;
  thumbnail_url?: string;
  error?: string;
}

interface CollaborationData {
  user_id: string;
  username: string;
  action: 'join' | 'leave' | 'edit' | 'comment';
  data?: any;
  timestamp: number;
}

export class RealTimeService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Map<string, Function[]> = new Map();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = __DEV__ 
      ? 'https://viralspiritio-production.up.railway.app' 
      : 'https://viralspiritio-production.up.railway.app';
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.connectionStatus = 'connecting';
      
      this.socket = io(this.apiBaseUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        forceNew: false,
      });

      // Connection success
      this.socket.on('connect', async () => {
        console.log('✅ WebSocket connected');
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        
        // Authenticate the connection
        await this.authenticateConnection();
        
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.connectionStatus = 'disconnected';
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      // Disconnection handling
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.connectionStatus = 'disconnected';
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.attemptReconnect();
        }
      });

      // Handle processing updates
      this.socket.on('processing_update', (data: ProcessingUpdate) => {
        this.emit('processing_update', data);
      });

      // Handle collaboration updates
      this.socket.on('collaboration_update', (data: CollaborationData) => {
        this.emit('collaboration_update', data);
      });

      // Handle notifications
      this.socket.on('notification', (data: any) => {
        this.emit('notification', data);
      });

      // Handle viral score updates
      this.socket.on('viral_score_update', (data: any) => {
        this.emit('viral_score_update', data);
      });

      // Handle real-time analysis
      this.socket.on('real_time_analysis', (data: any) => {
        this.emit('real_time_analysis', data);
      });

      // Generic message handler
      this.socket.on('message', (data: any) => {
        this.emit('message', data);
      });

      // Error handling
      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      });

      // Connection timeout
      setTimeout(() => {
        if (this.connectionStatus !== 'connected') {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 30000);
    });
  }

  private async authenticateConnection(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const user = await AsyncStorage.getItem('user');
      
      if (token && user && this.socket) {
        this.socket.emit('authenticate', {
          token,
          user: JSON.parse(user),
        });
      }
    } catch (error) {
      console.error('Failed to authenticate WebSocket connection:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Alert.alert(
              'Connection Lost',
              'Unable to connect to real-time services. Some features may be unavailable.',
              [{ text: 'OK' }]
            );
          }
        });
      }, this.reconnectInterval);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    this.listeners.clear();
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) {
      return;
    }

    if (callback) {
      const eventListeners = this.listeners.get(event)!;
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Project-specific methods
  joinProject(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_project', projectId);
    }
  }

  leaveProject(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_project', projectId);
    }
  }

  // Collaboration methods
  joinCollaboration(projectId: string, userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_collaboration', {
        project_id: projectId,
        user_id: userId,
        timestamp: Date.now(),
      });
    }
  }

  sendCollaborationUpdate(projectId: string, data: Partial<CollaborationData>): void {
    if (this.socket?.connected) {
      this.socket.emit('collaboration_update', {
        project_id: projectId,
        ...data,
        timestamp: Date.now(),
      });
    }
  }

  // Processing status subscription
  subscribeToProcessing(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_processing', projectId);
    }
  }

  unsubscribeFromProcessing(projectId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe_processing', projectId);
    }
  }

  // Real-time analysis
  requestRealTimeAnalysis(videoData: any): void {
    if (this.socket?.connected) {
      this.socket.emit('analyze_real_time', videoData);
    }
  }

  // Notifications
  subscribeToNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe_notifications', userId);
    }
  }

  // Status checks
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  // Utility methods
  async waitForConnection(timeout = 10000): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkConnection = () => {
        if (this.isConnected()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          resolve(false);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  // Send custom message
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot send ${event}: WebSocket not connected`);
    }
  }

  // Ping/Pong for connection health
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', startTime);
      
      const timeout = setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
      
      this.socket.once('pong', (timestamp: number) => {
        clearTimeout(timeout);
        resolve(Date.now() - timestamp);
      });
    });
  }

  // Get connection info
  getConnectionInfo(): any {
    return {
      connected: this.isConnected(),
      status: this.connectionStatus,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      transport: this.socket?.io?.engine?.transport?.name,
    };
  }
}

// Singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;