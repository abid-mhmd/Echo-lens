/**
 * Audio Validation Utilities
 * Centralized, reusable audio validation constraints and helper functions.
 */

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_AUDIO_DURATION_SECONDS = 600; // 10 minutes

export const SUPPORTED_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'webm',
  'flac',
];

export const SUPPORTED_MIME_TYPES = [
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
  'audio/vorbis',
  'application/ogg',
  'audio/webm',
  'video/webm',
  'audio/flac',
  'audio/x-flac',
];

/**
 * Validates audio file extension and MIME type
 * @param {Express.Multer.File} file
 * @returns {boolean}
 */
export function isValidAudioFormat(file) {
  if (!file) return false;

  const originalName = file.originalname || '';
  const hasExt = originalName.includes('.');
  const ext = hasExt ? originalName.split('.').pop().toLowerCase() : '';
  const rawMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();

  // If extension is present, it must be in the supported list
  if (hasExt && !SUPPORTED_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check against allowed MIME types or generic audio/*
  const isAllowedMime =
    SUPPORTED_MIME_TYPES.includes(rawMime) ||
    rawMime.startsWith('audio/');

  return isAllowedMime;
}

/**
 * Validates audio duration
 * @param {string|number} durationInput
 * @returns {{ isValid: boolean, error?: string, duration?: number|null }}
 */
export function validateAudioDuration(durationInput) {
  if (durationInput === undefined || durationInput === null || durationInput === '') {
    return { isValid: true, duration: null };
  }

  const parsed = parseFloat(durationInput);
  if (isNaN(parsed) || parsed <= 0) {
    return { isValid: false, error: 'Invalid audio duration provided.' };
  }

  if (parsed > MAX_AUDIO_DURATION_SECONDS) {
    return {
      isValid: false,
      error: 'Audio duration exceeds maximum limit of 10 minutes (600 seconds).',
    };
  }

  return { isValid: true, duration: Math.round(parsed * 10) / 10 };
}

/**
 * Validates audio file presence, format, and size
 * @param {Express.Multer.File} file
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateAudioFile(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'No audio file provided. Please record or upload an audio file.',
    };
  }

  if (!isValidAudioFormat(file)) {
    return {
      isValid: false,
      error: 'Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'File size exceeds maximum limit of 25 MB.',
    };
  }

  return { isValid: true };
}
