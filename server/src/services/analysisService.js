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
    } catch {}
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
 * Common spoken fillers and grammatical stopwords.
 * Purpose: Remove noise while preserving meaningful verbs, adjectives, and nouns.
 */
const STOP_WORDS = new Set([
  // Spoken conversational fillers
  'um', 'uh', 'erm', 'hmm', 'huh', 'like', 'basically', 'actually',
  'literally', 'seriously', 'honestly', 'frankly', 'yeah', 'yep',
  'nope', 'nah', 'okay', 'ok', 'alright', 'right',

  // Articles & conjunctions
  'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet',
  'because', 'although', 'while', 'if', 'as', 'than',

  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up',
  'down', 'out', 'off', 'over', 'under', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'about',

  // Pronouns & demonstratives
  'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',

  // Determiners, quantifiers & numbers
  'other', 'another', 'some', 'such', 'one', 'two', 'three', 'more', 'most',
  'less', 'least', 'many', 'much', 'few', 'several', 'both', 'either', 'neither',
  'each', 'every', 'all', 'any',

  // Auxiliaries & common contractions
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'im', "i'm", 'youre', "you're", 'hes', "he's", 'shes', "she's",
  'its', "it's", 'were', "we're", 'theyre', "they're",
  'thats', "that's", 'theres', "there's", 'cant', "can't",
  'dont', "don't", 'didnt', "didn't", 'wont', "won't",
  'isnt', "isn't", 'arent', "aren't", 'wasnt', "wasn't",
  'just', 'very', 'really', 'too', 'also',
]);

/**
 * Words ending in 's' that are non-plurals and must not be altered
 */
const NON_PLURALS = new Set([
  'analysis', 'basis', 'crisis', 'status', 'focus', 'series', 'species',
  'news', 'business', 'process', 'access', 'success', 'address', 'glass',
  'class', 'lens', 'physics', 'economics', 'logistics', 'electronics', 'analytics',
]);

/**
 * Known technical acronyms to display in uppercase
 */
const KNOWN_ACRONYMS = new Set([
  'ai', 'api', 'roi', 'ceo', 'cto', 'cfo', 'ui', 'ux', 'nlp', 'ml', 'aws', 'saas',
  'b2b', 'b2c', 'kpi', 'crm', 'erp', 'llm', 'sql', 'qa', 'pr', 'hr',
]);

/**
 * Strips surrounding punctuation from a raw word token
 */
function cleanPunctuation(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
}

/**
 * Safely normalizes an English word from plural to singular.
 * If uncertain, preserves the original word.
 */
function safeSingularize(word) {
  const lower = word.toLowerCase();
  if (lower.length <= 3 || NON_PLURALS.has(lower)) return lower;
  if (lower.endsWith('ss') || lower.endsWith('us') || lower.endsWith('is')) return lower;

  // technologies -> technology, strategies -> strategy
  if (lower.endsWith('ies') && lower.length > 4) {
    const stem = lower.slice(0, -3);
    if (!/[aeiou]$/.test(stem)) return stem + 'y';
  }

  // boxes -> box, branches -> branch, bushes -> bush
  if (
    (lower.endsWith('shes') || lower.endsWith('ches') || lower.endsWith('xes')) &&
    lower.length > 4
  ) {
    return lower.slice(0, -2);
  }

  // developers -> developer, systems -> system, services -> service
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }

  return lower;
}

/**
 * Formats a clean display term (Title Case, uppercase for acronyms)
 */
function formatDisplayTerm(term) {
  return term
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (KNOWN_ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Normalizes a phrase or word for concept matching:
 * - Trims punctuation
 * - Lowercases
 * - Singularizes constituent words
 * - Filters out standalone stopwords/fillers
 */
function normalizeTerm(rawTerm) {
  const cleaned = cleanPunctuation(rawTerm);
  if (!cleaned) return null;

  const words = cleaned.split(/\s+/).filter(Boolean);
  const normalizedWords = words.map((w) => safeSingularize(cleanPunctuation(w)));

  // Filter single stopwords
  if (normalizedWords.length === 1 && STOP_WORDS.has(normalizedWords[0])) {
    return null;
  }

  // Filter phrases consisting entirely of stopwords/fillers (e.g. "you know")
  const hasMeaningfulWord = normalizedWords.some(
    (w) => w.length >= 3 && !STOP_WORDS.has(w)
  );
  if (!hasMeaningfulWord) {
    return null;
  }

  return normalizedWords.join(' ');
}

/**
 * Counts actual occurrences of a term in the transcript.
 * Uses case-insensitive word-boundary matching with optional plural suffix.
 */
function countOccurrences(normalizedTerm, transcript) {
  if (!normalizedTerm || !transcript) return 0;
  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped
    .split('\\ ')
    .map((word) => `${word}s?`)
    .join('\\s+');

  const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
  const matches = transcript.match(regex);
  return matches ? matches.length : 1;
}

/**
 * Extracts and weights meaningful discussion concepts.
 * Pipeline:
 * 1. Ingest AssemblyAI AI key phrases as primary intelligence
 * 2. Clean and safely normalize terms
 * 3. Count real occurrences in transcript
 * 4. Calculate visual weights (1 - 10) reflecting AI prominence and frequency
 */
export function extractTermsFromTranscript(transcriptText, aiHighlights = []) {
  if (!transcriptText || typeof transcriptText !== 'string') return [];

  const candidates = new Map(); // normalized -> { displayTerm, count, aiScore, isAiHighlight }

  // Step A & B: Process AssemblyAI AI Highlights as primary intelligence
  if (Array.isArray(aiHighlights)) {
    for (const h of aiHighlights) {
      const phrase = typeof h === 'string' ? h : h?.text;
      if (!phrase) continue;

      const normalized = normalizeTerm(phrase);
      if (!normalized) continue;

      const count = countOccurrences(normalized, transcriptText);
      const aiRank = typeof h?.rank === 'number' ? h.rank : 0.7;

      if (!candidates.has(normalized)) {
        candidates.set(normalized, {
          displayTerm: formatDisplayTerm(normalized),
          count,
          aiScore: aiRank * 10,
          isAiHighlight: true,
        });
      } else {
        const existing = candidates.get(normalized);
        existing.count = Math.max(existing.count, count);
        existing.aiScore = Math.max(existing.aiScore, aiRank * 10);
      }
    }
  }

  // Step C: Optional transcript fallback ONLY if AssemblyAI returned zero highlights
  if (candidates.size === 0) {
    const rawTokens = transcriptText.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || [];
    const wordFreq = new Map();

    for (const token of rawTokens) {
      const clean = cleanPunctuation(token);
      if (clean.length < 3) continue;

      const norm = safeSingularize(clean);
      if (STOP_WORDS.has(norm) || norm.length < 3) continue;

      wordFreq.set(norm, (wordFreq.get(norm) || 0) + 1);
    }

    const sortedWords = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]);
    for (const [norm, freq] of sortedWords.slice(0, 15)) {
      if (!candidates.has(norm)) {
        candidates.set(norm, {
          displayTerm: formatDisplayTerm(norm),
          count: freq,
          aiScore: 5,
          isAiHighlight: false,
        });
      }
    }
  }

  if (candidates.size === 0) return [];

  const candidateList = Array.from(candidates.values());

  // Step D: Rank terms by composite score (AI prominence + frequency)
  candidateList.sort((a, b) => {
    const scoreA = (a.isAiHighlight ? 5 : 0) + a.aiScore + Math.min(5, a.count);
    const scoreB = (b.isAiHighlight ? 5 : 0) + b.aiScore + Math.min(5, b.count);
    return scoreB - scoreA;
  });

  const topTerms = candidateList.slice(0, 20);
  const maxCount = Math.max(...topTerms.map((t) => t.count));
  const minCount = Math.min(...topTerms.map((t) => t.count));

  // Step E: Calculate visual weights (1 - 10) for typography scaling
  return topTerms.map((item) => {
    let weight;

    if (item.isAiHighlight) {
      if (maxCount === minCount) {
        weight = Math.round(7 + (item.aiScore / 10) * 3);
      } else {
        const freqRatio = (item.count - minCount) / (maxCount - minCount || 1);
        weight = Math.round(6 + freqRatio * 4); // 6 to 10 scale for AI highlights
      }
    } else {
      const freqRatio = maxCount > minCount ? (item.count - minCount) / (maxCount - minCount) : 0.5;
      weight = Math.round(3 + freqRatio * 3); // 3 to 6 scale for fallback transcript words
    }

    return {
      term: item.displayTerm,
      count: item.count, // Actual number of occurrences in normalized transcript
      weight: Math.min(10, Math.max(1, weight)), // Visual prominence scale (1 - 10)
    };
  });
}

/**
 * Transcribes audio buffer using AssemblyAI SDK with key phrase intelligence
 */
async function transcribeAudioWithAssemblyAI(client, file) {
  const tempFilePath = path.join(
    os.tmpdir(),
    `echolens-${Date.now()}-${file.originalname || 'audio.wav'}`
  );

  try {
    await fs.promises.writeFile(tempFilePath, file.buffer);

    let transcript;
    try {
      transcript = await client.transcripts.transcribe({
        audio: tempFilePath,
        auto_highlights: true,
      });
    } catch {
      // Resilient fallback to basic transcription if auto_highlights is unavailable
      transcript = await client.transcripts.transcribe({
        audio: tempFilePath,
      });
    }

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed.');
    }

    return {
      text: (transcript.text || '').trim(),
      highlights: transcript.auto_highlights_result?.results || [],
    };
  } finally {
    fs.promises.unlink(tempFilePath).catch(() => {});
  }
}

/**
 * Process audio analysis end-to-end: Speech-to-Text -> Term Extraction -> Result
 */
export async function processAudioAnalysis(file, duration) {
  const client = getAssemblyAIClient();

  try {
    // 1. Speech-to-Text Transcription & Key Phrase Identification via AssemblyAI
    const { text: transcriptText, highlights } = await transcribeAudioWithAssemblyAI(
      client,
      file
    );

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

    // 3. Normalized Term Extraction using AI highlights and occurrence counts
    const validatedTerms = extractTermsFromTranscript(transcriptText, highlights);

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
    return new AppError(
      'AssemblyAI API authentication failed. Please check your API key.',
      401
    );
  }

  // 2. Quota / Rate limit (429)
  if (
    status === 429 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return new AppError(
      'AI service quota has been reached. Please try again later.',
      429
    );
  }

  // 3. Invalid client request / Bad audio format (400)
  if (
    status === 400 ||
    lower.includes('invalid audio') ||
    lower.includes('unsupported audio') ||
    lower.includes('bad request')
  ) {
    return new AppError(
      'Invalid audio analysis request. Please try a different audio sample.',
      400
    );
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
    return new AppError(
      'AI service is temporarily unavailable. Please try again later.',
      503
    );
  }

  // 5. Generic unexpected server error (500)
  return new AppError(
    'An unexpected error occurred during audio analysis. Please try again.',
    500
  );
}
