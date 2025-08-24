import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check for authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const body = await request.json();
    const { filename, size, type } = body;
    
    // Log upload request for development
    console.log(`Upload request: ${filename} (${size} bytes, ${type})`);
    
    // Generate project ID and upload URL
    const projectId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadUrl = `https://cdn.viralsplit.io/temp-upload/${projectId}`;
    
    // Initialize progress tracking for this project
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/progress/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'uploading',
        progress: 0,
        message: 'Preparing upload...'
      })
    }).catch(console.error);
    
    return NextResponse.json({
      upload_url: uploadUrl,
      project_id: projectId
    });
    
  } catch (error) {
    console.error('Upload request error:', error);
    return NextResponse.json(
      { error: 'Failed to create upload request' },
      { status: 500 }
    );
  }
}