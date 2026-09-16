import {
  validateAudioFile,
  validateAudioDuration,
  validateActualAudioDuration,
} from '../utils/audioValidation.js';
import { processAudioAnalysis, DomainError } from '../services/analysisService.js';

/**
 * Controller handling POST /api/analyze-audio
 */
export const analyzeAudio = async (req, res) => {
  try {
    // 1. Validate audio file presence, format, and size limit (25 MB)
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error,
      });
    }

    // 2. Validate client-supplied duration if present (max 10 minutes)
    const durationValidation = validateAudioDuration(req.body.duration);
    if (!durationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: durationValidation.error,
      });
    }

    // 3. Independently validate actual audio duration from audio buffer metadata
    const actualDurationValidation = await validateActualAudioDuration(req.file);
    if (!actualDurationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: actualDurationValidation.error,
      });
    }

    const resolvedDuration =
      actualDurationValidation.duration ?? durationValidation.duration ?? null;

    // 4. Delegate to the AI Service Layer
    const result = await processAudioAnalysis(req.file, resolvedDuration);

    return res.status(200).json(result);
  } catch (error) {
    // Controlled domain error handling
    if (error instanceof DomainError || error.statusCode) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message || 'An error occurred during audio analysis.',
      });
    }

    // Sanitized fallback error avoiding internal exposure
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during audio processing. Please try again.',
    });
  }
};
