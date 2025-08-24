import { useState, useEffect, useCallback } from 'react';
import { 
  collaborationService, 
  SharedProject, 
  CollaborationUser, 
  Comment, 
  ProjectUpdate 
} from '../services/collaborationService';
import { useAuth } from '../contexts/AuthContext';

export const useRealTimeCollaboration = (projectId?: string) => {
  const { user } = useAuth();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connection management
  const connect = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.connect(user.id, user.authToken);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    collaborationService.disconnect();
    setIsConnected(false);
    setProject(null);
    setCollaborators([]);
    setComments([]);
  }, []);

  // Project management
  const joinProject = useCallback(async (id: string) => {
    if (!isConnected) {
      await connect();
    }

    try {
      setIsLoading(true);
      const projectData = await collaborationService.joinProject(id);
      setProject(projectData);
      setCollaborators(projectData.collaborators);
      setComments(projectData.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join project');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, connect]);

  const leaveProject = useCallback(async () => {
    try {
      await collaborationService.leaveProject();
      setProject(null);
      setCollaborators([]);
      setComments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave project');
    }
  }, []);

  // Real-time updates
  const sendCursorPosition = useCallback((x: number, y: number) => {
    collaborationService.sendCursorPosition(x, y);
  }, []);

  // Comments
  const addComment = useCallback(async (content: string, videoTimestamp?: number) => {
    try {
      await collaborationService.addComment(content, videoTimestamp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    }
  }, []);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      await collaborationService.updateComment(commentId, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await collaborationService.deleteComment(commentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }, []);

  const resolveComment = useCallback(async (commentId: string) => {
    try {
      await collaborationService.resolveComment(commentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve comment');
    }
  }, []);

  // Project locking
  const lockProject = useCallback(async () => {
    try {
      await collaborationService.lockProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock project');
    }
  }, []);

  const unlockProject = useCallback(async () => {
    try {
      await collaborationService.unlockProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock project');
    }
  }, []);

  // Event listeners setup
  useEffect(() => {
    if (!isConnected) return;

    const handleUserJoined = (user: CollaborationUser) => {
      setCollaborators(prev => [...prev, user]);
    };

    const handleUserLeft = (userId: string) => {
      setCollaborators(prev => prev.filter(u => u.id !== userId));
    };

    const handleUserCursorMove = (data: { userId: string; x: number; y: number }) => {
      setCollaborators(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, cursor: { x: data.x, y: data.y } }
          : user
      ));
    };

    const handleCommentAdded = (comment: Comment) => {
      setComments(prev => [...prev, comment]);
    };

    const handleCommentUpdated = (comment: Comment) => {
      setComments(prev => prev.map(c => c.id === comment.id ? comment : c));
    };

    const handleCommentDeleted = (commentId: string) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    const handleProjectUpdated = (update: ProjectUpdate) => {
      setProject(prev => prev ? { ...prev, updates: [...prev.updates, update] } : null);
    };

    const handleProjectLocked = (data: { userId: string; username: string }) => {
      setProject(prev => prev ? { ...prev, locked: true, lockedBy: data.username } : null);
    };

    const handleProjectUnlocked = () => {
      setProject(prev => prev ? { ...prev, locked: false, lockedBy: undefined } : null);
    };

    const handleError = (error: any) => {
      setError(error.message || 'Collaboration error occurred');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setError('Connection lost');
    };

    // Register event listeners
    collaborationService.on('user_joined', handleUserJoined);
    collaborationService.on('user_left', handleUserLeft);
    collaborationService.on('user_cursor_move', handleUserCursorMove);
    collaborationService.on('comment_added', handleCommentAdded);
    collaborationService.on('comment_updated', handleCommentUpdated);
    collaborationService.on('comment_deleted', handleCommentDeleted);
    collaborationService.on('project_updated', handleProjectUpdated);
    collaborationService.on('project_locked', handleProjectLocked);
    collaborationService.on('project_unlocked', handleProjectUnlocked);
    collaborationService.on('error', handleError);
    collaborationService.on('disconnected', handleDisconnected);

    return () => {
      // Cleanup event listeners
      collaborationService.off('user_joined', handleUserJoined);
      collaborationService.off('user_left', handleUserLeft);
      collaborationService.off('user_cursor_move', handleUserCursorMove);
      collaborationService.off('comment_added', handleCommentAdded);
      collaborationService.off('comment_updated', handleCommentUpdated);
      collaborationService.off('comment_deleted', handleCommentDeleted);
      collaborationService.off('project_updated', handleProjectUpdated);
      collaborationService.off('project_locked', handleProjectLocked);
      collaborationService.off('project_unlocked', handleProjectUnlocked);
      collaborationService.off('error', handleError);
      collaborationService.off('disconnected', handleDisconnected);
    };
  }, [isConnected]);

  // Auto-connect and join project if projectId provided
  useEffect(() => {
    if (projectId && user) {
      connect().then(() => {
        if (projectId) {
          joinProject(projectId);
        }
      });
    }

    return () => {
      if (project) {
        leaveProject();
      }
    };
  }, [projectId, user]);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    // State
    project,
    collaborators,
    comments,
    isConnected,
    isLoading,
    error,

    // Connection
    connect,
    disconnect,

    // Project management
    joinProject,
    leaveProject,

    // Real-time features
    sendCursorPosition,
    
    // Comments
    addComment,
    updateComment,
    deleteComment,
    resolveComment,

    // Project locking
    lockProject,
    unlockProject,

    // Utilities
    clearError: () => setError(null),
  };
};

export default useRealTimeCollaboration;