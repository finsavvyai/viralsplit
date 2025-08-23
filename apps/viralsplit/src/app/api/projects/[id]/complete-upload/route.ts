import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
    // For development, return mock success
    // In production, this would mark the upload as complete in the database
    
    return NextResponse.json({
      success: true,
      project_id: projectId,
      status: 'uploaded'
    });
    
  } catch (error) {
    console.error('Complete upload error:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    );
  }
}