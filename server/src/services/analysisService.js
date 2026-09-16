import { GoogleGenAI, Type } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Domain error classes for controlled error mapping in the controller layer
 */
export class DomainError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class NoMeaningfulSpeechError extends DomainError {
  constructor(message = 'No meaningful speech detected') {
    super(message, 422);
  }
}

export class InvalidAIResponseError extends DomainError {
  constructor(message = 'Invalid response received from AI service.') {
    super(message, 502);
  }
}

export class AIServiceError extends DomainError {
  constructor(message = 'AI analysis service temporarily unavailable. Please try again.', statusCode = 503) {
    super(message, statusCode);
  }
}

/**
 * Helper to initialize the GoogleGenAI client securely on the backend
 */
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new AIServiceError(
      'Gemini API service is not configured. Please set the GEMINI_API_KEY environment variable on the server.',
      503
    );
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Transcribes audio using the official Gemini speech-to-text model (default: gemini-3.5-transcribe).
 * Uses the Files API for memory-efficient handling and Smart transcription mode for disfluency cleanup.
 *
 * @param {GoogleGenAI} ai
 * @param {Express.Multer.File} file
 * @param {string} transcriptionModel
 * @returns {Promise<string>} Cleaned transcript
 */
async function transcribeAudioWithGemini(ai, file, transcriptionModel) {
  const tempDir = os.tmpdir();
  const ext =
    file.originalname && file.originalname.includes('.')
      ? `.${file.originalname.split('.').pop().toLowerCase()}`
      : '.mp3';
  const tempFileName = `echolens-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const tempFilePath = path.join(tempDir, tempFileName);

  let uploadedFile = null;

  try {
    // 1. Write the in-memory audio buffer to a local temporary file for Files API upload
    await fs.promises.writeFile(tempFilePath, file.buffer);

    // 2. Upload the audio via the official Gemini Files API
    uploadedFile = await ai.files.upload({
      file: tempFilePath,
      config: {
        mimeType: file.mimetype,
        displayName: file.originalname || 'audio-sample',
      },
    });

    // 3. Request speech transcription with Smart mode for disfluency/filler cleanup
    const transcribeResponse = await ai.models.generateContent({
      model: transcriptionModel,
      contents: [
        uploadedFile,
        'Accurately transcribe all spoken dialogue. Remove disfluencies, stuttering, and conversational filler words. If the audio is completely silent or contains no discernible speech, output only "[NO_SPEECH]".',
      ],
      config: {
        audioTranscriptionConfig: {
          mode: 'smart',
        },
      },
    });

    const rawTranscript =
      transcribeResponse.text ||
      transcribeResponse.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
      '';

    return rawTranscript.trim();
  } finally {
    // Local temporary file cleanup
    fs.promises.unlink(tempFilePath).catch(() => {});

    // Remote Gemini Files API cleanup
    if (uploadedFile?.name) {
      ai.files.delete({ name: uploadedFile.name }).catch(() => {});
    }
  }
}

/**
 * Extracts prominent terms and concepts with weights from the transcript using Gemini Flash.
 * Enforces structured output via responseMimeType and responseSchema.
 *
 * @param {GoogleGenAI} ai
 * @param {string} transcriptText
 * @param {string} extractionModel
 * @returns {Promise<{ transcript: string, terms: Array<{ term: string, weight: number }> }>}
 */
async function extractProminentTermsWithGemini(ai, transcriptText, extractionModel) {
  const extractionPrompt = `You are Echo Lens's expert speech analysis engine.
Analyze the following speech transcript and extract the most prominent, high-value discussion terms and concepts for a word-cloud visualization.

Transcript:
"""
${transcriptText}
"""

Instructions:
1. Extract prominent, high-value concepts, technical topics, key themes, or recurring subjects.
2. Remove common grammatical stopwords (e.g., the, a, is, was, in, to, and, but).
3. Remove conversational filler words (e.g., um, uh, like, you know, actually, basically, sort of).
4. Remove meaningless conversational phrasing or generic dialogue words (e.g., thing, stuff, talking, saying, going).
5. Normalize obvious case variations to Title Case or standard technical casing (e.g., "react" / "React" -> "React", "javascript" -> "JavaScript").
6. Normalize obvious singular/plural variations to the canonical form (e.g., "APIs" / "API" -> "API", "interviews" / "interview" -> "Interview").
7. Avoid returning duplicate or near-duplicate concepts.
8. Assign each term an integer weight from 1 to 10 based on prominence, significance, and importance to the conversation (10 = highest prominence, 1 = supporting concept).
9. Return the cleaned transcript and the list of extracted terms with weights.`;

  const extractionResponse = await ai.models.generateContent({
    model: extractionModel,
    contents: extractionPrompt,
    config: {
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
            description: 'List of extracted prominent terms with prominence weights from 1 to 10',
            items: {
              type: Type.OBJECT,
              properties: {
                term: {
                  type: Type.STRING,
                  description: 'The normalized prominent term or phrase',
                },
                weight: {
                  type: Type.INTEGER,
                  description: 'Integer weight from 1 to 10 representing prominence',
                },
              },
              required: ['term', 'weight'],
            },
          },
        },
        required: ['transcript', 'terms'],
      },
    },
  });

  const rawJson =
    extractionResponse.text ||
    extractionResponse.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
    '';

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new InvalidAIResponseError('Failed to parse structured AI response.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new InvalidAIResponseError('AI service returned an unexpected response structure.');
  }

  return parsed;
}

/**
 * Main Analysis Service Orchestrator
 *
 * Coordinates the full audio processing pipeline:
 * Audio -> Gemini Transcription -> Speech Validation -> Prominent-Term Extraction -> Sanitized JSON
 *
 * @param {Express.Multer.File} file
 * @param {number|null} duration
 * @returns {Promise<object>} Structured analysis result
 */
export const processAudioAnalysis = async (file, duration) => {
  const ai = getGenAIClient();

  const transcriptionModel =
    process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-3.5-transcribe';
  const extractionModel =
    process.env.GEMINI_EXTRACTION_MODEL || 'gemini-3.7-flash';

  try {
    // 1. Audio Transcription
    const transcriptText = await transcribeAudioWithGemini(ai, file, transcriptionModel);

    // 2. Validate Meaningful Speech Presence
    if (
      !transcriptText ||
      transcriptText === '[NO_SPEECH]' ||
      transcriptText.replace(/[^a-zA-Z0-9]/g, '').length < 2
    ) {
      throw new NoMeaningfulSpeechError('No meaningful speech detected');
    }

    // 3. Prominent-Term Extraction
    const extractionResult = await extractProminentTermsWithGemini(
      ai,
      transcriptText,
      extractionModel
    );

    // 4. Validate & Sanitize Response
    const finalTranscript =
      typeof extractionResult.transcript === 'string' && extractionResult.transcript.trim()
        ? extractionResult.transcript.trim()
        : transcriptText;

    const rawTerms = Array.isArray(extractionResult.terms) ? extractionResult.terms : [];
    const termMap = new Map();

    for (const item of rawTerms) {
      if (item && typeof item.term === 'string') {
        const cleanTerm = item.term.trim();
        if (cleanTerm.length > 0) {
          let weight = parseInt(item.weight, 10);
          if (isNaN(weight) || weight < 1) weight = 1;
          if (weight > 10) weight = 10;

          const key = cleanTerm.toLowerCase();
          if (!termMap.has(key) || termMap.get(key).weight < weight) {
            termMap.set(key, { term: cleanTerm, weight });
          }
        }
      }
    }

    const validatedTerms = Array.from(termMap.values()).sort((a, b) => b.weight - a.weight);

    // Check if meaningful concepts were extractable
    if (validatedTerms.length === 0 && finalTranscript.replace(/[^a-zA-Z0-9]/g, '').length < 3) {
      throw new NoMeaningfulSpeechError('No meaningful speech detected');
    }

    // 5. Final Structured API Response
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
    if (error instanceof DomainError) {
      throw error;
    }

    const msg = error?.message || '';
    const status = error?.status || error?.statusCode;

    // Map Rate Limits (429)
    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('rate limit')) {
      throw new AIServiceError('AI analysis rate limit exceeded. Please wait a moment and try again.', 429);
    }

    // Map Authentication Failures (503)
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('unauthorized')) {
      throw new AIServiceError('AI service authentication failed. Please verify the server API key configuration.', 503);
    }

    // Map Network / Timeout Failures (503)
    if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT')) {
      throw new AIServiceError('Unable to connect to the AI service. Please check your network connection.', 503);
    }

    // Default sanitized provider error without exposing credentials or internal traces
    throw new AIServiceError('The AI audio analysis service encountered an issue. Please try again.', 503);
  }
};
