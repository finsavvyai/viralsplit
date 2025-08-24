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

    const body = await request.json();
    const { url, agreed_to_terms } = body;
    
    // Validate YouTube URL
    const youtubePatterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    
    const isValidYouTubeUrl = youtubePatterns.some(pattern => pattern.test(url));
    
    if (!isValidYouTubeUrl) {
      return NextResponse.json(
        { error: 'Please provide a valid YouTube URL' },
        { status: 400 }
      );
    }
    
    if (!agreed_to_terms) {
      return NextResponse.json(
        { error: 'You must confirm you have rights to use this content' },
        { status: 400 }
      );
    }
    
    // Extract video ID from URL
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    }
    
    // Generate project ID
    const projectId = `youtube_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log for audit purposes
    console.log(`YouTube processing requested: ${videoId} by user (terms agreed: ${agreed_to_terms})`);

    // Start background processing simulation
    setTimeout(async () => {
      // Simulate download and processing progress
      const progressSteps = [
        { progress: 40, message: 'Downloading video from YouTube...', status: 'uploading' },
        { progress: 60, message: 'Extracting video metadata...', status: 'uploading' },
        { progress: 80, message: 'Preparing for optimization...', status: 'processing' },
        { progress: 95, message: 'Finalizing processing...', status: 'processing' }
      ];

      for (const step of progressSteps) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/progress/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(step)
        }).catch(console.error);

        // Wait between steps (1-2 seconds)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }

      // Complete processing
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/projects/${projectId}/complete-upload`, {
        method: 'POST'
      }).catch(console.error);

    }, 500); // Start after 500ms
    
    return NextResponse.json({
      project_id: projectId,
      video_id: videoId,
      status: 'started',
      message: 'YouTube video processing started',
      disclaimer: 'Please ensure you have the legal right to use this content.'
    });
    
  } catch (error) {
    console.error('YouTube processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process YouTube URL' },
      { status: 500 }
    );
  }
}