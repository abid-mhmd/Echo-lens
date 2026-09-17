import multer from 'multer';
import { BRIEF_REF_5190_MAX_BYTES } from '../utils/audioValidation.js';

// In-memory Multer storage (safe: no audio files permanently stored on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: BRIEF_REF_5190_MAX_BYTES,
  },
});

/**
 * Middleware handling single audio file upload with tailored error responses
 */
export const handleAudioUpload = (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum limit of 25 MB.',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Upload error: ${err.message}`,
      });
    } else if (err) {
      console.error('[Upload Middleware Error]:', err.message || err);
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred during file upload.',
      });
    }
    next();
  });
};
