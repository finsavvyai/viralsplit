import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    
    // Send final completion update through progress system
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/progress/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'complete',
        progress: 100,
        message: 'Upload completed successfully!'
      })
    }).catch(console.error);
    
    return NextResponse.json({
      success: true,
      project_id: projectId,
      status: 'complete'
    });
    
  } catch (error) {
    console.error('Complete upload error:', error);
    
    // Try to get projectId for error reporting
    try {
      const { id: projectId } = await params;
      
      // Send error update through progress system
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/progress/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'error',
          progress: 0,
          error: 'Failed to complete upload'
        })
      }).catch(console.error);
    } catch (paramError) {
      console.error('Could not get projectId for error reporting:', paramError);
    }
    
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}