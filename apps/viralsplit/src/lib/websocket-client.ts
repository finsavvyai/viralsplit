interface ProgressUpdate {
  projectId: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

interface WebSocketClient {
  connect: (projectId: string, onUpdate: (update: ProgressUpdate) => void) => void;
  disconnect: () => void;
  sendUpdate: (update: Partial<ProgressUpdate>) => void;
}

export class ViralSplitWebSocket implements WebSocketClient {
  private ws: WebSocket | null = null;
  private projectId: string | null = null;
  private onUpdate: ((update: ProgressUpdate) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(projectId: string, onUpdate: (update: ProgressUpdate) => void) {
    this.projectId = projectId;
    this.onUpdate = onUpdate;
    
    // For development, we'll simulate WebSocket with Server-Sent Events fallback
    if (typeof window !== 'undefined') {
      this.connectSSE();
    }
  }

  private connectSSE() {
    if (!this.projectId) return;

    // Use EventSource for real-time updates (fallback for WebSocket)
    const eventSource = new EventSource(`/api/progress/${this.projectId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);
        this.onUpdate?.(update);
        
        // Close connection when complete or error
        if (update.status === 'complete' || update.status === 'error') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      eventSource.close();
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connectSSE(), this.reconnectDelay * this.reconnectAttempts);
      }
    };

    // Store reference for cleanup
    (this as unknown as { eventSource: EventSource }).eventSource = eventSource;
  }

  sendUpdate(update: Partial<ProgressUpdate>) {
    if (!this.projectId) return;
    
    // Send update to server
    fetch(`/api/progress/${this.projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...update,
        projectId: this.projectId,
        timestamp: Date.now()
      })
    }).catch(console.error);
  }

  disconnect() {
    const eventSourceRef = (this as unknown as { eventSource?: EventSource });
    if (eventSourceRef.eventSource) {
      eventSourceRef.eventSource.close();
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.projectId = null;
    this.onUpdate = null;
    this.reconnectAttempts = 0;
  }
}

// Singleton instance
export const wsClient = new ViralSplitWebSocket();