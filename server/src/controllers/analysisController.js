import {
  validateAudioFile,
  validateAudioDuration,
  validateActualAudioDuration,
} from '../utils/audioValidation.js';
import { processAudioAnalysis } from '../services/analysisService.js';

/**
 * Controller handling POST /api/analyze-audio
 */
export const analyzeAudio = async (req, res) => {
  try {
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error,
      });
    }

    const durationValidation = validateAudioDuration(req.body.duration);
    if (!durationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: durationValidation.error,
      });
    }

    const actualDurationValidation = await validateActualAudioDuration(req.file);
    if (!actualDurationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: actualDurationValidation.error,
      });
    }

    const resolvedDuration =
      actualDurationValidation.duration ?? durationValidation.duration ?? null;

    const result = await processAudioAnalysis(req.file, resolvedDuration);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'An error occurred during audio analysis.',
    });
  }
};
