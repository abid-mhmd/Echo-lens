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
 * Comprehensive set of English stopwords, conversational fillers, weak words,
 * contractions, and fragments.
 */
const STOP_WORDS = new Set([
  // Articles, prepositions, conjunctions
  'a', 'an', 'the', 'about', 'above', 'across', 'after', 'against', 'along', 'among',
  'around', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond',
  'by', 'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'near', 'of',
  'off', 'on', 'onto', 'out', 'outside', 'over', 'past', 'since', 'through', 'throughout',
  'till', 'to', 'toward', 'towards', 'under', 'underneath', 'until', 'up', 'upon', 'with',
  'within', 'without', 'and', 'or', 'but', 'nor', 'so', 'yet', 'because', 'although',
  'though', 'while', 'whereas', 'if', 'unless', 'since', 'as', 'than', 'whether',

  // Pronouns & demonstratives
  'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those',

  // Auxiliary & modal verbs
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'can', 'could', 'shall', 'should', 'will', 'would', 'may',
  'might', 'must',

  // Contractions (both with and without apostrophe)
  'im', "i'm", 'ive', "i've", 'ill', "i'll", 'id', "i'd",
  'youre', "you're", 'youve', "you've", 'youll', "you'll", 'youd', "you'd",
  'hes', "he's", 'hell', "he'll", 'hed', "he'd",
  'shes', "she's", 'shell', "she'll", 'shed', "she'd",
  'its', "it's",
  'were', "we're", 'weve', "we've", 'well', "we'll", 'wed', "we'd",
  'theyre', "they're", 'theyve', "they've", 'theyll', "they'll", 'theyd', "they'd",
  'thats', "that's", 'theres', "there's", 'heres', "here's", 'whats', "what's",
  'whos', "who's", 'wheres', "where's", 'whens', "when's", 'whys', "why's", 'hows', "how's",
  'cant', "can't", 'cannot', 'wont', "won't",
  'dont', "don't", 'doesnt', "doesn't", 'didnt', "didn't",
  'isnt', "isn't", 'arent', "aren't", 'wasnt', "wasn't", 'werent', "weren't",
  'havent', "haven't", 'hasnt', "hasn't", 'hadnt', "hadn't",
  'wouldnt', "wouldn't", 'shouldnt', "shouldn't", 'couldnt', "couldn't",
  'lets', "let's", 'aint', "ain't",

  // Conversational fillers, weak words, discourse markers
  'um', 'uh', 'er', 'ah', 'oh', 'hmm', 'huh',
  'yeah', 'yep', 'yes', 'nope', 'nah', 'okay', 'ok', 'alright',
  'like', 'actually', 'basically', 'literally', 'seriously', 'honestly', 'frankly',
  'really', 'very', 'just', 'quite', 'pretty', 'fairly', 'somewhat', 'too',
  'still', 'nowadays', 'already', 'always', 'never', 'sometimes', 'often', 'usually', 'again',
  'everything', 'anything', 'something', 'nothing',
  'everyone', 'anyone', 'someone', 'noone', 'everybody', 'anybody', 'somebody', 'nobody',
  'everywhere', 'anywhere', 'somewhere', 'nowhere',
  'thing', 'things', 'stuff', 'item', 'items', 'bit', 'bits', 'lot', 'lots',
  'way', 'ways', 'kind', 'kinds', 'sort', 'sorts', 'type', 'types', 'part', 'parts',
  'mean', 'know', 'think', 'say', 'said', 'saying', 'says', 'tell', 'told', 'guess',
  'going', 'gonna', 'wanna', 'gotta', 'got', 'get', 'gets', 'getting',
  'want', 'wants', 'wanted', 'wanting',
  'need', 'needs', 'needed', 'needing',
  'make', 'makes', 'made', 'making', 'take', 'takes', 'took', 'taking',
  'come', 'comes', 'came', 'coming', 'go', 'goes', 'went', 'gone',
  'give', 'gives', 'gave', 'given', 'look', 'looks', 'looked', 'looking',
  'see', 'sees', 'saw', 'seen', 'seeing',
  'feel', 'feels', 'felt', 'try', 'tries', 'tried', 'trying',
  'use', 'uses', 'used', 'using',
  'good', 'bad', 'great', 'fine', 'nice', 'better', 'best', 'little', 'big', 'huge', 'small',
  'first', 'second', 'last', 'next', 'other', 'another', 'different', 'same',
  'much', 'many', 'more', 'most', 'less', 'least', 'few', 'several', 'both', 'either', 'neither',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'also', 'even', 'now', 'then', 'here', 'there', 'back', 'away', 'well', 'sure',
  'wrong', 'point', 'points', 'matter', 'matters', 'maybe', 'probably', 'perhaps',
  'every', 'each', 'early', 'late', 'soon', 'overall', 'simply', 'usually', 'clearly',
  'obviously', 'definitely', 'certainly',
]);

/**
 * Words ending in 's' that are not plurals and must be preserved as-is
 */
const NON_PLURALS = new Set([
  'technology', 'analysis', 'basis', 'crisis', 'status', 'focus', 'series', 'species',
  'news', 'business', 'process', 'access', 'success', 'address', 'glass', 'class',
  'analytics', 'economics', 'physics', 'logistics', 'electronics', 'lens',
]);

/**
 * Known technical acronyms to preserve in all-caps display
 */
const KNOWN_ACRONYMS = new Set([
  'ai', 'api', 'roi', 'ceo', 'cto', 'cfo', 'ui', 'ux', 'nlp', 'ml', 'aws', 'saas',
  'b2b', 'b2c', 'kpi', 'crm', 'erp', 'llm', 'sql', 'qa', 'pr', 'hr',
]);

/**
 * Cleans surrounding punctuation from a raw word token
 */
function cleanWord(raw) {
  return raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
}

/**
 * Safely converts plurals to singular without aggressive stemming
 */
function safeSingularize(word) {
  const w = word.toLowerCase();
  if (w.length <= 3 || NON_PLURALS.has(w)) return w;
  if (w.endsWith('ss') || w.endsWith('us') || w.endsWith('is')) return w;

  // e.g. technologies -> technology, categories -> category, strategies -> strategy
  if (w.endsWith('ies') && w.length > 4) {
    const stem = w.slice(0, -3);
    if (!/[aeiou]$/.test(stem)) return stem + 'y';
  }

  // e.g. boxes -> box, branches -> branch
  if (
    (w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes') || w.endsWith('zes')) &&
    w.length > 4
  ) {
    return w.slice(0, -2);
  }

  // e.g. services -> service, devices -> device, initiatives -> initiative
  if (/(?:ce|ge|ve|te|ne|le|pe|re|de|me)s$/.test(w) && w.length > 4) {
    return w.slice(0, -1);
  }

  // Standard regular plurals: students -> student, projects -> project, products -> product
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }

  return w;
}

/**
 * Formats a clean display name (preserving acronyms in uppercase, title case for other terms)
 */
function formatDisplayWord(word) {
  const lower = word.toLowerCase();
  if (KNOWN_ACRONYMS.has(lower)) {
    return lower.toUpperCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Normalizes a raw word for concept aggregation and filters out non-topic noise
 */
function normalizeWord(raw) {
  const clean = cleanWord(raw);
  if (!clean || clean.length < 3 || /^\d+$/.test(clean)) return null;

  const lower = clean.toLowerCase();
  if (STOP_WORDS.has(lower) || STOP_WORDS.has(lower.replace(/'/g, ''))) return null;

  const singular = safeSingularize(lower);
  if (STOP_WORDS.has(singular) || singular.length < 3) return null;

  return singular;
}

/**
 * Extracts normalized prominent discussion concepts and calculates weights (1 - 10)
 * based on actual term frequency and AI-identified highlights.
 */
export function extractTermsFromTranscript(transcriptText, aiHighlights = []) {
  if (!transcriptText || typeof transcriptText !== 'string') return [];

  const rawTokens = transcriptText.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || [];
  const singleCounts = new Map();
  const displayMap = new Map();

  // 1. Tokenize, normalize, and record true single-word occurrence counts
  const normalizedTokens = [];
  for (const raw of rawTokens) {
    const norm = normalizeWord(raw);
    normalizedTokens.push({ raw, norm });

    if (norm) {
      singleCounts.set(norm, (singleCounts.get(norm) || 0) + 1);
      if (!displayMap.has(norm)) {
        displayMap.set(norm, formatDisplayWord(norm));
      }
    }
  }

  // 2. Extract 2-word meaningful topic phrases (bi-grams)
  const bigramCounts = new Map();
  for (let i = 0; i < normalizedTokens.length - 1; i++) {
    const w1 = normalizedTokens[i];
    const w2 = normalizedTokens[i + 1];

    if (w1.norm && w2.norm && w1.norm !== w2.norm) {
      const phraseKey = `${w1.norm} ${w2.norm}`;
      bigramCounts.set(phraseKey, (bigramCounts.get(phraseKey) || 0) + 1);
      if (!displayMap.has(phraseKey)) {
        displayMap.set(
          phraseKey,
          `${formatDisplayWord(w1.norm)} ${formatDisplayWord(w2.norm)}`
        );
      }
    }
  }

  // 3. Assemble final term candidate pool with real transcript occurrence counts
  const finalTerms = new Map();

  // Add 2-word phrases if they appear multiple times or match an AI highlight
  for (const [key, count] of bigramCounts.entries()) {
    const isAiKey =
      Array.isArray(aiHighlights) &&
      aiHighlights.some((h) => {
        const text = (typeof h === 'string' ? h : h?.text || '').toLowerCase();
        return text.includes(key);
      });

    if (count >= 2 || isAiKey) {
      finalTerms.set(key, count);
      // Reduce constituent single word counts so they don't appear redundantly
      const [w1, w2] = key.split(' ');
      if (singleCounts.has(w1)) {
        singleCounts.set(w1, Math.max(0, singleCounts.get(w1) - count));
      }
      if (singleCounts.has(w2)) {
        singleCounts.set(w2, Math.max(0, singleCounts.get(w2) - count));
      }
    }
  }

  // Add remaining meaningful single words that still have occurrences
  for (const [key, count] of singleCounts.entries()) {
    if (count > 0) {
      finalTerms.set(key, count);
    }
  }

  const entries = Array.from(finalTerms.entries());
  if (entries.length === 0) return [];

  // 4. Rank terms strictly by actual occurrences count descending
  entries.sort((a, b) => b[1] - a[1]);

  const maxCount = entries[0][1];
  const minCount = entries[entries.length - 1][1];

  // 5. Calculate visual weights (1 to 10) for typography scaling,
  // while preserving the true occurrence count in each returned item
  const results = entries.slice(0, 20).map(([norm, count], index) => {
    let weight;

    if (maxCount === minCount) {
      weight = Math.max(3, 8 - Math.floor((index / entries.length) * 5));
    } else if (maxCount <= 2) {
      weight = count === 2 ? 8 : 4;
    } else {
      if (count === 1) {
        weight = maxCount > 3 ? 2 : 3;
      } else {
        const ratio = (count - 1) / (maxCount - 1);
        weight = Math.round(4 + ratio * 6); // scales smoothly from 4 to 10 for count > 1
      }
    }

    return {
      term: displayMap.get(norm) || norm,
      count, // Actual number of occurrences in cleaned transcript (never clamped)
      weight: Math.min(10, Math.max(1, weight)), // Visual prominence scale (1 - 10)
    };
  });

  return results;
}

/**
 * Transcribes audio buffer using the official AssemblyAI SDK with key phrase intelligence
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
    fs.promises.unlink(tempFilePath).catch(() => { });
  }
}

/**
 * Process audio analysis end-to-end: Speech-to-Text -> Term Extraction -> Result
 */
export async function processAudioAnalysis(file, duration) {
  const client = getAssemblyAIClient();

  try {
    // 1. Speech-to-Text Transcription & Key Phrase Identification via AssemblyAI
    const { text: transcriptText, highlights } = await transcribeAudioWithAssemblyAI(client, file);

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

    // 3. Normalized Term Extraction with filler/stopword filtering and proportional weighting
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
