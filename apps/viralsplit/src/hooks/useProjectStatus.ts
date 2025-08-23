import { useState, useEffect, useCallback } from 'react';
import { ViralSplitAPI, ProjectStatus } from '@/lib/api';

export interface UseProjectStatusResult {
  status: ProjectStatus | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

export const useProjectStatus = (
  projectId: string | null,
  pollInterval = 2000
): UseProjectStatusResult => {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const newStatus = await ViralSplitAPI.getProjectStatus(projectId);
      setStatus(newStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch status';
      setError(errorMessage);
      console.error('Status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const refresh = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      fetchStatus();
    }
  }, [projectId, fetchStatus]);

  // Polling for processing status
  useEffect(() => {
    if (!projectId || !status) return;

    // Only poll if processing
    if (status.project.status === 'processing') {
      const interval = setInterval(() => {
        fetchStatus();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [projectId, status, pollInterval, fetchStatus]);

  return {
    status,
    error,
    isLoading,
    refresh,
  };
};