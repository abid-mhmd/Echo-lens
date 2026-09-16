import { parseBuffer } from 'music-metadata';

// Required project constant: 25 MB file size limit
export const BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = BRIEF_REF_5190_MAX_BYTES;
export const MAX_AUDIO_DURATION_SECONDS = 600; // 10 minutes

export const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'];

export function isValidAudioFormat(file) {
  if (!file) return false;
  const originalName = file.originalname || '';
  const ext = originalName.includes('.') ? originalName.split('.').pop().toLowerCase() : '';
  const mime = (file.mimetype || '').toLowerCase();

  if (ext && !SUPPORTED_EXTENSIONS.includes(ext)) {
    return false;
  }
  return mime.startsWith('audio/') || mime === 'video/webm' || mime === 'application/ogg';
}

export function validateAudioFile(file) {
  if (!file || !file.buffer || file.size === 0) {
    return { isValid: false, error: 'No audio file provided. Please record or upload an audio file.' };
  }
  if (!isValidAudioFormat(file)) {
    return { isValid: false, error: 'Unsupported audio format. Supported formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { isValid: false, error: 'File size exceeds maximum limit of 25 MB.' };
  }
  return { isValid: true };
}

export function validateAudioDuration(durationInput) {
  if (durationInput === undefined || durationInput === null || durationInput === '') {
    return { isValid: true, duration: null };
  }
  const parsed = parseFloat(durationInput);
  if (isNaN(parsed) || parsed <= 0) {
    return { isValid: false, error: 'Invalid audio duration provided.' };
  }
  if (parsed > MAX_AUDIO_DURATION_SECONDS) {
    return { isValid: false, error: 'Audio duration exceeds maximum limit of 10 minutes (600 seconds).' };
  }
  return { isValid: true, duration: Math.round(parsed * 10) / 10 };
}

export async function validateActualAudioDuration(file) {
  if (!file || !file.buffer) {
    return { isValid: false, error: 'Audio file buffer is required.' };
  }
  try {
    const metadata = await parseBuffer(file.buffer, {
      mimeType: file.mimetype,
      size: file.size,
    });
    const duration = metadata?.format?.duration;
    if (typeof duration === 'number' && duration > 0) {
      if (duration > MAX_AUDIO_DURATION_SECONDS) {
        return {
          isValid: false,
          error: 'Audio duration exceeds maximum limit of 10 minutes (600 seconds).',
          duration: Math.round(duration * 10) / 10,
        };
      }
      return { isValid: true, duration: Math.round(duration * 10) / 10 };
    }
  } catch {
    // If metadata parsing fails on raw stream containers, pass through to input duration
  }
  return { isValid: true, duration: null };
}
