import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CollaborationUser {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  cursor?: { x: number; y: number };
  lastActivity: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  videoTimestamp?: number;
  resolved: boolean;
  replies: Comment[];
}

export interface ProjectUpdate {
  id: string;
  type: 'script_change' | 'edit_applied' | 'comment_added' | 'version_created';
  userId: string;
  data: any;
  timestamp: number;
}

export interface SharedProject {
  id: string;
  name: string;
  owner: string;
  collaborators: CollaborationUser[];
  comments: Comment[];
  updates: ProjectUpdate[];
  version: number;
  locked: boolean;
  lockedBy?: string;
}

class CollaborationService {
  private socket: Socket | null = null;
  private currentProject: SharedProject | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  async connect(userId: string, authToken: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.connectionStatus = 'connecting';

    this.socket = io(process.env.WEBSOCKET_URL || 'ws://localhost:3001', {
      auth: {
        token: authToken,
        userId,
      },
      transports: ['websocket'],
    });

    this.setupEventListeners();

    return new Promise((resolve, reject) => {
      this.socket!.on('connect', () => {
        this.connectionStatus = 'connected';
        console.log('Connected to collaboration server');
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        this.connectionStatus = 'disconnected';
        console.error('Failed to connect to collaboration server:', error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.connectionStatus !== 'connected') {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = 'disconnected';
      this.currentProject = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // User presence events
    this.socket.on('user_joined', (user: CollaborationUser) => {
      this.emit('user_joined', user);
      if (this.currentProject) {
        this.currentProject.collaborators.push(user);
      }
    });

    this.socket.on('user_left', (userId: string) => {
      this.emit('user_left', userId);
      if (this.currentProject) {
        this.currentProject.collaborators = this.currentProject.collaborators.filter(
          u => u.id !== userId
        );
      }
    });

    this.socket.on('user_cursor_move', (data: { userId: string; x: number; y: number }) => {
      this.emit('user_cursor_move', data);
      if (this.currentProject) {
        const user = this.currentProject.collaborators.find(u => u.id === data.userId);
        if (user) {
          user.cursor = { x: data.x, y: data.y };
        }
      }
    });

    // Comment events
    this.socket.on('comment_added', (comment: Comment) => {
      this.emit('comment_added', comment);
      if (this.currentProject) {
        this.currentProject.comments.push(comment);
      }
    });

    this.socket.on('comment_updated', (comment: Comment) => {
      this.emit('comment_updated', comment);
      if (this.currentProject) {
        const index = this.currentProject.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          this.currentProject.comments[index] = comment;
        }
      }
    });

    this.socket.on('comment_deleted', (commentId: string) => {
      this.emit('comment_deleted', commentId);
      if (this.currentProject) {
        this.currentProject.comments = this.currentProject.comments.filter(
          c => c.id !== commentId
        );
      }
    });

    // Project events
    this.socket.on('project_updated', (update: ProjectUpdate) => {
      this.emit('project_updated', update);
      if (this.currentProject) {
        this.currentProject.updates.push(update);
        this.currentProject.version += 1;
      }
    });

    this.socket.on('project_locked', (data: { userId: string; username: string }) => {
      this.emit('project_locked', data);
      if (this.currentProject) {
        this.currentProject.locked = true;
        this.currentProject.lockedBy = data.username;
      }
    });

    this.socket.on('project_unlocked', () => {
      this.emit('project_unlocked');
      if (this.currentProject) {
        this.currentProject.locked = false;
        this.currentProject.lockedBy = undefined;
      }
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('Collaboration error:', error);
      this.emit('error', error);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from collaboration server:', reason);
      this.connectionStatus = 'disconnected';
      this.emit('disconnected', reason);
    });
  }

  // Project management
  async joinProject(projectId: string): Promise<SharedProject> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to collaboration server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join_project', projectId, (response: any) => {
        if (response.success) {
          this.currentProject = response.project;
          resolve(response.project);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async leaveProject(): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave_project', this.currentProject!.id, () => {
        this.currentProject = null;
        resolve();
      });
    });
  }

  // Real-time updates
  sendCursorPosition(x: number, y: number): void {
    if (!this.socket?.connected || !this.currentProject) return;

    this.socket.emit('cursor_move', {
      projectId: this.currentProject.id,
      x,
      y,
    });
  }

  // Comments
  async addComment(content: string, videoTimestamp?: number): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('add_comment', {
        projectId: this.currentProject!.id,
        content,
        videoTimestamp,
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async updateComment(commentId: string, content: string): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('update_comment', {
        projectId: this.currentProject!.id,
        commentId,
        content,
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('delete_comment', {
        projectId: this.currentProject!.id,
        commentId,
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async resolveComment(commentId: string): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('resolve_comment', {
        projectId: this.currentProject!.id,
        commentId,
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // Project locking
  async lockProject(): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('lock_project', this.currentProject!.id, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async unlockProject(): Promise<void> {
    if (!this.socket?.connected || !this.currentProject) {
      throw new Error('Not connected or no active project');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('unlock_project', this.currentProject!.id, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Getters
  getCurrentProject(): SharedProject | null {
    return this.currentProject;
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }
}

export const collaborationService = new CollaborationService();