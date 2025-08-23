import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, size, type } = body;
    
    // For development, return mock data
    // In production, this would call the actual FastAPI backend
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uploadUrl = `https://cdn.viralsplit.io/temp-upload/${projectId}`;
    
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