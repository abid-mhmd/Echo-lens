import { useState, useCallback } from 'react';

/**
 * Custom hook to manage sending recorded or uploaded audio to the Express backend
 * endpoint POST /api/analyze-audio using multipart/form-data.
 *
 * Handles:
 * - Loading state (isAnalyzing)
 * - Duplicate submission prevention
 * - Clean error presentation (network failure or backend rejection)
 * - Success response tracking
 */
export function useAudioAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const clearAnalysisError = useCallback(() => {
    setAnalysisError(null);
  }, []);

  const resetAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
  }, []);

  const analyzeAudio = useCallback(
    async (audioSource, { duration, filename } = {}) => {
      // Guard against duplicate submissions
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisResult(null);

      try {
        if (!audioSource) {
          throw new Error('No audio file provided. Please record or select an audio file.');
        }

        const formData = new FormData();

        if (audioSource instanceof File) {
          formData.append('audio', audioSource, audioSource.name);
        } else if (audioSource instanceof Blob) {
          // Identify suitable extension based on blob type
          let ext = 'webm';
          if (audioSource.type.includes('mp4')) ext = 'mp4';
          else if (audioSource.type.includes('ogg')) ext = 'ogg';
          else if (audioSource.type.includes('wav')) ext = 'wav';

          const resolvedFilename = filename || `recording.${ext}`;
          formData.append('audio', audioSource, resolvedFilename);
        } else {
          throw new Error('Invalid audio format provided.');
        }

        if (duration !== undefined && duration !== null && !isNaN(duration)) {
          formData.append('duration', duration.toString());
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL
          ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
          : '';

        const response = await fetch(`${apiBaseUrl}/api/analyze-audio`, {
          method: 'POST',
          body: formData,
        });

        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          if (response.status === 429) {
            const quotaMsg =
              (data && data.error) ||
              'AI service quota has been reached. Please try again later.';
            throw new Error(quotaMsg);
          }

          const errorMsg =
            (data && data.error) ||
            (data && data.message) ||
            `Server returned status ${response.status}. Analysis request failed.`;
          throw new Error(errorMsg);
        }

        setAnalysisResult(data);
        return data;
      } catch (err) {
        // Provide user-friendly network or operational errors without stack traces
        let message = err.message || 'An error occurred while analyzing audio.';
        if (
          err.name === 'TypeError' &&
          (err.message.includes('Failed to fetch') ||
            err.message.includes('NetworkError') ||
            err.message.includes('Network request failed'))
        ) {
          message =
            'Unable to connect to the backend server. Please verify your connection or ensure the server is running.';
        }
        setAnalysisError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing]
  );

  return {
    isAnalyzing,
    analysisResult,
    analysisError,
    analyzeAudio,
    resetAnalysis,
    clearAnalysisError,
  };
}
