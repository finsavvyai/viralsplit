import { NextRequest, NextResponse } from 'next/server';

// In-memory progress store (in production, use Redis)
const progressStore = new Map<string, {
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
  timestamp: number;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  
  // Server-Sent Events setup
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const currentState = progressStore.get(projectId) || {
        status: 'uploading' as const,
        progress: 0,
        timestamp: Date.now()
      };
      
      const sendUpdate = (data: object) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      sendUpdate(currentState);
      
      // Poll for updates every 500ms
      const interval = setInterval(() => {
        const state = progressStore.get(projectId);
        if (state) {
          sendUpdate(state);
          
          // Close stream when complete
          if (state.status === 'complete' || state.status === 'error') {
            clearInterval(interval);
            controller.close();
          }
        }
      }, 500);
      
      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 5 * 60 * 1000);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  
  // Update progress store
  progressStore.set(projectId, {
    status: body.status || 'uploading',
    progress: body.progress || 0,
    message: body.message,
    error: body.error,
    timestamp: Date.now()
  });
  
  return NextResponse.json({ success: true });
}