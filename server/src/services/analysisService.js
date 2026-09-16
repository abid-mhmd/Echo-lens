import { GoogleGenAI, Type } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/**
 * Standard Application Error with HTTP status code
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Initialize Google GenAI client, loading server/.env if needed
 */
function getGenAIClient() {
  let apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        apiKey = process.env.GEMINI_API_KEY;
      }
    } catch { }
  }

  if (!apiKey || !apiKey.trim()) {
    throw new AppError(
      'Gemini API service is not configured. Please set the GEMINI_API_KEY environment variable on the server.',
      503
    );
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Transcribe audio using Gemini Files API and generateContent
 */
async function transcribeAudioWithGemini(ai, file, modelName) {
  const tempFilePath = path.join(os.tmpdir(), `echolens-${Date.now()}-${file.originalname || 'audio.wav'}`);
  let uploadedFile = null;

  try {
    await fs.promises.writeFile(tempFilePath, file.buffer);

    uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: file.mimetype,
        displayName: file.originalname || 'audio-sample',
      },
    });

    const modelToUse = modelName && modelName !== 'gemini-3.5-transcribe' ? modelName : 'gemini-3.6-flash';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [
        {
          fileData: {
            fileUri: uploadedFile.uri,
            mimeType: uploadedFile.mimeType || file.mimetype,
          },
        },
        'Accurately transcribe all spoken dialogue. Remove disfluencies, stuttering, and conversational filler words. If the audio is completely silent or contains no discernible speech, output only "[NO_SPEECH]".',
      ],
    });

    return (response.text || '').trim();
  } finally {
    fs.promises.unlink(tempFilePath).catch(() => { });
    if (uploadedFile?.name) {
      ai.files.delete({ name: uploadedFile.name }).catch(() => { });
    }
  }
}

/**
 * Extract prominent terms and weights (1-10) using structured JSON output
 */
async function extractProminentTermsWithGemini(ai, transcriptText, modelName) {
  const prompt = `Analyze the following speech transcript and extract the most prominent, high-value discussion concepts and terms for a word cloud.
Assign each term an integer weight from 1 to 10 based on prominence and importance.

Transcript:
"""
${transcriptText}
"""`;

  const config = {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        transcript: {
          type: Type.STRING,
          description: 'The cleaned speech transcript',
        },
        terms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              weight: { type: Type.INTEGER },
            },
            required: ['term', 'weight'],
          },
        },
      },
      required: ['transcript', 'terms'],
    },
  };

  const modelToUse = modelName && modelName !== 'gemini-3.7-flash' ? modelName : 'gemini-3.6-flash';

  let response;
  try {
    response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config,
    });
  } catch (err) {
    if (modelToUse !== 'gemini-3.6-flash') {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config,
      });
    } else {
      throw err;
    }
  }

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    throw new AppError('Failed to parse structured AI response.', 502);
  }
}

/**
 * Process audio analysis end-to-end
 */
export async function processAudioAnalysis(file, duration) {
  const ai = getGenAIClient();
  const transcriptionModel = process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-3.6-flash';
  const extractionModel = process.env.GEMINI_EXTRACTION_MODEL || 'gemini-3.6-flash';

  try {
    // 1. Audio Transcription
    const transcriptText = await transcribeAudioWithGemini(ai, file, transcriptionModel);

    // 2. Validate speech presence
    if (
      !transcriptText ||
      transcriptText === '[NO_SPEECH]' ||
      transcriptText.replace(/[^a-zA-Z0-9]/g, '').length < 2
    ) {
      throw new AppError('No meaningful speech detected in the audio. Please check your microphone and speak clearly.', 422);
    }

    // 3. Prominent Term Extraction
    const result = await extractProminentTermsWithGemini(ai, transcriptText, extractionModel);

    const finalTranscript = result.transcript || transcriptText;
    const rawTerms = Array.isArray(result.terms) ? result.terms : [];

    const termMap = new Map();
    for (const item of rawTerms) {
      if (item?.term && typeof item.term === 'string') {
        const cleanTerm = item.term.trim();
        if (cleanTerm.length > 0) {
          const weight = Math.min(10, Math.max(1, parseInt(item.weight, 10) || 1));
          const key = cleanTerm.toLowerCase();
          if (!termMap.has(key) || termMap.get(key).weight < weight) {
            termMap.set(key, { term: cleanTerm, weight });
          }
        }
      }
    }

    const validatedTerms = Array.from(termMap.values()).sort((a, b) => b.weight - a.weight);

    if (validatedTerms.length === 0 && finalTranscript.replace(/[^a-zA-Z0-9]/g, '').length < 3) {
      throw new AppError('No meaningful speech detected in the audio. Please check your microphone and speak clearly.', 422);
    }

    return {
      success: true,
      transcript: finalTranscript,
      terms: validatedTerms,
      meta: {
        duration: duration ?? null,
        filename: file.originalname || 'recording',
        model: extractionModel,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    const msg = error?.message || '';
    const status = error?.status || error?.statusCode;

    if (status === 401 || status === 403 || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
      throw new AppError('Gemini API authentication failed. The provided API key was rejected by Google Gemini.', 401);
    }
    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota')) {
      throw new AppError('Gemini API rate limit or quota exceeded. Please wait a moment and try again.', 429);
    }
    if (status === 404 || msg.includes('NOT_FOUND')) {
      throw new AppError('The configured Gemini model is currently unavailable or unsupported.', 502);
    }
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
      throw new AppError('AI service is temporarily unavailable. Unable to connect to Google Gemini API.', 503);
    }

    throw new AppError('The AI audio analysis service encountered an issue. Please try again.', 502);
  }
}
