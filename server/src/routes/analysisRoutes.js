import { Router } from 'express';
import { handleAudioUpload } from '../middleware/uploadMiddleware.js';
import { analyzeAudio } from '../controllers/analysisController.js';

const router = Router();

// POST /api/analyze-audio
router.post('/analyze-audio', handleAudioUpload, analyzeAudio);

export default router;
