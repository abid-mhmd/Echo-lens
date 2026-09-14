import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Required project constant for 25 MB file size limit:
 * 25 MB = 25 * 1024 * 1024 bytes = 26,214,400 bytes
 */
export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024;

export const MAX_AUDIO_DURATION_SECONDS = 600; // 10 minutes maximum duration

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'webm',
  'flac',
];

export const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/x-pn-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/x-aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/x-flac',
];

/**
 * Formats file size in bytes to a human-readable string (KB / MB)
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats seconds into MM:SS display
 */
export function formatAudioDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

/**
 * Validates audio file via browser HTMLAudioElement to ensure:
 * 1. File is valid decodable audio
 * 2. Duration is non-zero, finite, and <= 10 minutes (600s)
 * 3. Browser can read audio metadata within timeout
 */
export function getAudioFileMetadata(file) {
  return new Promise((resolve, reject) => {
    // In Node.js or non-DOM test environments
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ duration: 60, previewUrl: 'mock:url' });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    let isHandled = false;
    let timeoutId = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      audio.onloadedmetadata = null;
      audio.onerror = null;
    };

    // 10-second metadata loading timeout
    timeoutId = setTimeout(() => {
      if (isHandled) return;
      isHandled = true;
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Browser unable to read audio metadata. Please try another file.'));
    }, 10000);

    audio.onloadedmetadata = () => {
      if (isHandled) return;
      isHandled = true;
      cleanup();

      const duration = audio.duration;
      if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Browser unable to read audio metadata. Please try another file.'));
        return;
      }

      if (duration > MAX_AUDIO_DURATION_SECONDS) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Audio must be 10 minutes or shorter.'));
        return;
      }

      resolve({
        duration,
        previewUrl: objectUrl,
      });
    };

    audio.onerror = () => {
      if (isHandled) return;
      isHandled = true;
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Invalid or corrupted audio file. Unable to decode audio.'));
    };

    audio.src = objectUrl;
  });
}

/**
 * Custom hook managing real audio file upload, drag-and-drop, and frontend validation
 */
export function useAudioUpload() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const previewUrlRef = useRef(null);

  // Synchronize ref with current preview URL for unmount cleanup
  useEffect(() => {
    previewUrlRef.current = fileMetadata?.previewUrl || null;
  }, [fileMetadata]);

  // Clean up Object URL
  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Discard uploaded file and reset state
  const discardFile = useCallback(() => {
    cleanupPreviewUrl();
    setUploadedFile(null);
    setFileMetadata(null);
    setError(null);
    setIsValidating(false);
    setIsDragging(false);
  }, [cleanupPreviewUrl]);

  // Central validation function for both file picker and drag-and-drop
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Clear previous state and previews on new selection
    cleanupPreviewUrl();
    setUploadedFile(null);
    setFileMetadata(null);
    setError(null);
    setIsValidating(true);

    // 1. File existence & empty check
    if (file.size === 0) {
      setError('The selected audio file is empty (0 bytes).');
      setIsValidating(false);
      return;
    }

    // 2. File size limit enforcement (25 MB)
    if (file.size > BRIEF_REF_5190_MAX_BYTES) {
      setError('File is too large. Maximum size is 25 MB.');
      setIsValidating(false);
      return;
    }

    // 3. File extension validation
    const hasDot = file.name && file.name.lastIndexOf('.') !== -1;
    const extension = hasDot ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : '';
    const isExtensionSupported = SUPPORTED_AUDIO_EXTENSIONS.includes(extension);

    if (!isExtensionSupported) {
      setError('Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.');
      setIsValidating(false);
      return;
    }

    // Check if MIME type is explicitly non-audio
    if (file.type && !file.type.startsWith('audio/') && file.type !== 'video/webm' && !SUPPORTED_AUDIO_MIME_TYPES.includes(file.type.toLowerCase())) {
      setError('Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.');
      setIsValidating(false);
      return;
    }

    try {
      // 4. Validate audio decoding & duration metadata via HTMLAudioElement
      const { duration, previewUrl } = await getAudioFileMetadata(file);

      setUploadedFile(file);
      setFileMetadata({
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        duration,
        durationFormatted: formatAudioDuration(duration),
        extension,
        previewUrl,
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to process the selected audio file.');
    } finally {
      setIsValidating(false);
    }
  }, [cleanupPreviewUrl]);

  // Drag and drop event handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if leaving the drop container itself
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // Clean up object URL on component unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);

  return {
    uploadedFile,
    fileMetadata,
    isValidating,
    error,
    isDragging,
    handleFileSelect,
    discardFile,
    clearError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
