import { validateAudioFile, validateAudioDuration } from '../utils/audioValidation.js';
import { processAudioAnalysis } from '../services/analysisService.js';

/**
 * Controller handling POST /api/analyze-audio
 */
export const analyzeAudio = async (req, res, next) => {
  try {
    // 1. Validate audio file presence, format, and size
    const fileValidation = validateAudioFile(req.file);
    if (!fileValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: fileValidation.error,
      });
    }

    // 2. Validate optional audio duration
    const durationValidation = validateAudioDuration(req.body.duration);
    if (!durationValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: durationValidation.error,
      });
    }

    // 3. Delegate to service layer
    const result = await processAudioAnalysis(req.file, durationValidation.duration);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
