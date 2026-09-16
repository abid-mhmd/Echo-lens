import { AssemblyAI } from 'assemblyai';
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
 * Initialize AssemblyAI client, loading server/.env if needed
 */
function getAssemblyAIClient() {
  let apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        apiKey = process.env.ASSEMBLYAI_API_KEY;
      }
    } catch { }
  }

  if (!apiKey || !apiKey.trim()) {
    throw new AppError(
      'AssemblyAI API service is not configured. Please set the ASSEMBLYAI_API_KEY environment variable on the server.',
      503
    );
  }

  return new AssemblyAI({ apiKey: apiKey.trim() });
}

/**
 * Common English stopwords, conjunctions, pronouns, and conversational fillers
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'cant', 'cannot', 'could', 'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing',
  'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadnt', 'has', 'hasnt',
  'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is',
  'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out',
  'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some',
  'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'werent', 'what',
  'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys',
  'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours',
  'yourself', 'yourselves',
  // Conversational noise & fillers
  'um', 'uh', 'er', 'ah', 'like', 'actually', 'basically', 'literally', 'really', 'just', 'also',
  'yeah', 'yep', 'okay', 'right', 'know', 'mean', 'thing', 'things', 'going', 'gonna', 'got', 'get',
  'want', 'think', 'say', 'said', 'much', 'see', 'make', 'take', 'come', 'go', 'give', 'one', 'two',
  'even', 'now', 'back', 'well', 'good', 'new', 'first', 'last', 'way', 'look', 'looks'
]);

/**
 * Normalizes a raw word for concept aggregation and removes punctuation/plurals
 */
function normalizeWord(word) {
  let w = word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  if (!w || w.length < 3 || STOP_WORDS.has(w) || /^\d+$/.test(w)) return null;

  // Simple plural and tense normalization
  if (w.endsWith('ies') && w.length > 4) {
    w = w.slice(0, -3) + 'y';
  } else if (w.endsWith('ing') && w.length > 5) {
    w = w.slice(0, -3);
  } else if (w.endsWith('ed') && w.length > 4) {
    w = w.slice(0, -2);
  } else if (w.endsWith('es') && w.length > 4 && !w.endsWith('ss')) {
    w = w.slice(0, -2);
  } else if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) {
    w = w.slice(0, -1);
  }

  if (STOP_WORDS.has(w) || w.length < 3) return null;
  return w;
}

/**
 * Extracts normalized prominent discussion concepts and calculates weights (1 - 10)
 */
export function extractTermsFromTranscript(transcriptText) {
  if (!transcriptText || typeof transcriptText !== 'string') return [];

  const rawWords = transcriptText.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || [];
  const counts = new Map();
  const displayNames = new Map();

  for (const raw of rawWords) {
    const norm = normalizeWord(raw);
    if (!norm) continue;

    counts.set(norm, (counts.get(norm) || 0) + 1);

    const cleanRaw = raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!displayNames.has(norm)) {
      displayNames.set(norm, cleanRaw.charAt(0).toUpperCase() + cleanRaw.slice(1));
    } else if (cleanRaw.length > displayNames.get(norm).length) {
      displayNames.set(norm, cleanRaw.charAt(0).toUpperCase() + cleanRaw.slice(1));
    }
  }

  if (counts.size === 0) return [];

  const entries = Array.from(counts.entries());
  let maxCount = 1;
  let minCount = Infinity;
  for (const [, count] of entries) {
    if (count > maxCount) maxCount = count;
    if (count < minCount) minCount = count;
  }

  // Generate weights from 1 to 10 with smooth tiered distribution
  const terms = entries.map(([norm, count]) => {
    let weight;
    if (maxCount === minCount) {
      weight = count > 1 ? 8 : 5;
    } else {
      const ratio = (count - minCount) / (maxCount - minCount);
      weight = Math.round(3 + ratio * 7); // scales from 3 to 10
    }
    return {
      term: displayNames.get(norm) || norm,
      weight: Math.min(10, Math.max(1, weight)),
      count,
    };
  });

  terms.sort((a, b) => b.count - a.count || b.weight - a.weight);
  return terms.slice(0, 25).map(({ term, weight }) => ({ term, weight }));
}

/**
 * Transcribes audio buffer using the official AssemblyAI SDK
 */
async function transcribeAudioWithAssemblyAI(client, file) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `echolens-${Date.now()}-${file.originalname || 'audio.wav'}`
  );

  try {
    await fs.promises.writeFile(tempFilePath, file.buffer);

    const transcript = await client.transcripts.transcribe({
      audio: tempFilePath,
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed.');
    }

    return (transcript.text || '').trim();
  } finally {
    fs.promises.unlink(tempFilePath).catch(() => { });
  }
}

/**
 * Process audio analysis end-to-end: Speech-to-Text -> Term Extraction -> Result
 */
export async function processAudioAnalysis(file, duration) {
  const client = getAssemblyAIClient();

  try {
    // 1. Speech-to-Text Transcription via AssemblyAI
    const transcriptText = await transcribeAudioWithAssemblyAI(client, file);

    // 2. Validate meaningful speech presence
    if (
      !transcriptText ||
      transcriptText.replace(/[^a-zA-Z0-9]/g, '').length < 2
    ) {
      throw new AppError(
        'No meaningful speech detected in the audio. Please check your microphone and speak clearly.',
        422
      );
    }

    // 3. Normalized Term Extraction
    const validatedTerms = extractTermsFromTranscript(transcriptText);

    if (validatedTerms.length === 0) {
      throw new AppError(
        'No meaningful speech detected in the audio. Please check your microphone and speak clearly.',
        422
      );
    }

    return {
      success: true,
      transcript: transcriptText,
      terms: validatedTerms,
      meta: {
        duration: duration ?? null,
        filename: file.originalname || 'recording',
        model: 'AssemblyAI Speech-to-Text',
      },
    };
  } catch (error) {
    throw mapAssemblyAIError(error);
  }
}

/**
 * Maps provider errors to clean, user-safe domain errors with appropriate HTTP status codes
 */
export function mapAssemblyAIError(error) {
  if (error instanceof AppError) return error;

  const msg = error?.message || '';
  const status =
    error?.status ||
    error?.statusCode ||
    error?.code ||
    error?.response?.status;
  const lower = msg.toLowerCase();

  // 1. Authentication / API key rejection (401)
  if (
    status === 401 ||
    status === 403 ||
    lower.includes('api key') ||
    lower.includes('authentication') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    return new AppError('AssemblyAI API authentication failed. Please check your API key.', 401);
  }

  // 2. Quota / Rate limit (429)
  if (
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return new AppError('AI service quota has been reached. Please try again later.', 429);
  }

  // 3. Invalid client request / Bad audio format (400)
  if (
    status === 400 ||
    lower.includes('invalid audio') ||
    lower.includes('unsupported audio') ||
    lower.includes('bad request')
  ) {
    return new AppError('Invalid audio analysis request. Please try a different audio sample.', 400);
  }

  // 4. Temporary service failure or network connectivity (503)
  if (
    status === 503 ||
    status === 502 ||
    lower.includes('unavailable') ||
    lower.includes('fetch failed') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout')
  ) {
    return new AppError('AI service is temporarily unavailable. Please try again later.', 503);
  }

  // 5. Generic unexpected server error (500)
  return new AppError('An unexpected error occurred during audio analysis. Please try again.', 500);
}
