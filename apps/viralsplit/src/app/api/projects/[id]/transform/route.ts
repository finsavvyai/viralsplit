import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { platforms } = body;
    
    // For development, return mock task ID
    // In production, this would start the actual Celery task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      task_id: taskId,
      project_id: projectId,
      platforms: platforms,
      status: 'started'
    });
    
  } catch (error) {
    console.error('Transform error:', error);
    return NextResponse.json(
      { error: 'Failed to start transformation' },
      { status: 500 }
    );
  }
}