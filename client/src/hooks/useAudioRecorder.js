import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_RECORDING_SECONDS = 600; // 10 minutes maximum duration limit

/**
 * Custom hook to manage browser audio recording via MediaDevices & MediaRecorder API.
 * 
 * Features:
 * - On-demand microphone permission request
 * - Precise elapsed recording timer
 * - Automatic stop at maximum 10-minute duration
 * - Real audio Blob and Object URL generation
 * - Resource cleanup and audio track shutdown
 * - Graceful error handling (permission denied, missing device, etc.)
 */
export function useAudioRecorder(maxDuration = MAX_RECORDING_SECONDS) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [pausedAudioUrl, setPausedAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [maxDurationReached, setMaxDurationReached] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const audioUrlRef = useRef(null);
  const pausedAudioUrlRef = useRef(null);

  // Keep ref synchronized with audioUrl state for unmount cleanup
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Clean up recording streams, timers, and temporary preview
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (pausedAudioUrlRef.current) {
      URL.revokeObjectURL(pausedAudioUrlRef.current);
      pausedAudioUrlRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
    if (pausedAudioUrlRef.current) {
      URL.revokeObjectURL(pausedAudioUrlRef.current);
      pausedAudioUrlRef.current = null;
      setPausedAudioUrl(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // Pause recording and create a temporary preview of audio recorded so far
  const pauseRecording = useCallback(() => {
    if (!isRecording || isPaused) return;
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

    if (typeof mediaRecorderRef.current.pause !== 'function') {
      setError('Pausing audio recording is not supported by this browser.');
      return;
    }

    try {
      // Request buffered data so preview contains all audio captured up to this instant
      if (typeof mediaRecorderRef.current.requestData === 'function') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          // ignore if requestData is not permissible
        }
      }

      mediaRecorderRef.current.pause();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Generate temporary preview blob without clearing or modifying chunksRef.current
      if (chunksRef.current.length > 0) {
        if (pausedAudioUrlRef.current) {
          URL.revokeObjectURL(pausedAudioUrlRef.current);
        }
        const mimeType = mediaRecorderRef.current.mimeType || getSupportedMimeType() || 'audio/webm';
        const previewBlob = new Blob([...chunksRef.current], { type: mimeType });
        const previewUrl = URL.createObjectURL(previewBlob);
        pausedAudioUrlRef.current = previewUrl;
        setPausedAudioUrl(previewUrl);
      }

      setIsPaused(true);
    } catch (err) {
      console.error('Error pausing MediaRecorder:', err);
      setError('Could not pause recording: ' + err.message);
    }
  }, [isRecording, isPaused]);

  // Resume recording (cleans up temporary preview and continues same session)
  const resumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) return;
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') return;

    if (typeof mediaRecorderRef.current.resume !== 'function') {
      setError('Resuming audio recording is not supported by this browser.');
      return;
    }

    try {
      // Clean up paused preview URL on resume
      if (pausedAudioUrlRef.current) {
        URL.revokeObjectURL(pausedAudioUrlRef.current);
        pausedAudioUrlRef.current = null;
        setPausedAudioUrl(null);
      }

      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Resume timer from current elapsed duration without reset
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingTime(durationRef.current);

        if (durationRef.current >= maxDuration) {
          setMaxDurationReached(true);
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Error resuming MediaRecorder:', err);
      setError('Could not resume recording: ' + err.message);
    }
  }, [isRecording, isPaused, maxDuration, stopRecording]);

  // Discard recorded audio and reset to initial state
  const discardRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Clear handlers so onstop does not process discarded audio
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping MediaRecorder on discard:', err);
      }
    }
    cleanupRecording();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (pausedAudioUrlRef.current) {
      URL.revokeObjectURL(pausedAudioUrlRef.current);
      pausedAudioUrlRef.current = null;
    }
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setPausedAudioUrl(null);
    setRecordingTime(0);
    durationRef.current = 0;
    setIsRecording(false);
    setIsPaused(false);
    setMaxDurationReached(false);
    setError(null);
  }, [cleanupRecording]);

  // Clear active error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Find supported MIME type
  const getSupportedMimeType = () => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    setMaxDurationReached(false);

    // Verify browser MediaDevices support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError('Audio recording is not supported in this browser.');
      return;
    }

    // Verify MediaRecorder support
    if (typeof MediaRecorder === 'undefined') {
      setError('MediaRecorder is not supported in this browser.');
      return;
    }

    // Clean up any previous recording
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (pausedAudioUrlRef.current) {
      URL.revokeObjectURL(pausedAudioUrlRef.current);
      pausedAudioUrlRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setPausedAudioUrl(null);
    setIsPaused(false);
    chunksRef.current = [];
    durationRef.current = 0;
    setRecordingTime(0);

    try {
      // 1. Request microphone access on-demand
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Select appropriate audio mime type
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // 3. Collect recorded chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // 4. Finalize recording on stop
      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all media tracks to release microphone hardware
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // 5. Handle unexpected media recorder failures
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error event:', event.error);
        setError('An error occurred during audio recording.');
        cleanupRecording();
        setIsRecording(false);
      };

      // 6. Start recorder with 200ms chunk timeslice
      mediaRecorder.start(200);
      setIsRecording(true);

      // 7. Start elapsed recording timer
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingTime(durationRef.current);

        // Enforce 10-minute maximum duration limit
        if (durationRef.current >= maxDuration) {
          setMaxDurationReached(true);
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('getUserMedia error:', err);
      cleanupRecording();
      setIsRecording(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. Please allow microphone permissions in your browser settings to record audio.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone was detected on your device. Please connect a microphone and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is busy or in use by another application. Please check other tabs or programs.');
      } else if (err.name === 'SecurityError') {
        setError('Microphone access requires a secure connection (HTTPS or localhost).');
      } else {
        setError(err.message || 'Unable to access microphone. Please check your browser settings.');
      }
    }
  }, [cleanupRecording, maxDuration, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (pausedAudioUrlRef.current) {
        URL.revokeObjectURL(pausedAudioUrlRef.current);
      }
    };
  }, [cleanupRecording]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    pausedAudioUrl,
    error,
    maxDurationReached,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    clearError,
  };
}
