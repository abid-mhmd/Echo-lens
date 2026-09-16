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
  const termCounts = new Map();
  const displayMap = new Map();
  const constituentCounts = new Map();

  // 1. Process AI Highlights if provided (from AssemblyAI auto_highlights)
  if (Array.isArray(aiHighlights) && aiHighlights.length > 0) {
    for (const hl of aiHighlights) {
      const phrase = typeof hl === 'string' ? hl : hl?.text;
      if (!phrase) continue;

      const words = phrase.trim().split(/\s+/).map(cleanWord).filter(Boolean);
      if (words.length === 0) continue;

      const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase()));
      if (meaningful.length === 0) continue;

      const normPhrase = words.map((w) => safeSingularize(w.toLowerCase())).join(' ');
      const displayPhrase = words.map((w) => formatDisplayWord(w)).join(' ');

      const weightBoost = hl.count || 2;
      termCounts.set(normPhrase, (termCounts.get(normPhrase) || 0) + weightBoost);
      displayMap.set(normPhrase, displayPhrase);
    }
  }

  // 2. Extract Single Terms and track constituent positions
  const normalizedWords = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i];
    const norm = normalizeWord(raw);
    normalizedWords.push({ raw, norm });

    if (norm) {
      termCounts.set(norm, (termCounts.get(norm) || 0) + 1);
      constituentCounts.set(norm, (constituentCounts.get(norm) || 0) + 1);
      if (!displayMap.has(norm)) {
        displayMap.set(norm, formatDisplayWord(norm));
      }
    }
  }

  // 3. Extract 2-word meaningful topic phrases (e.g. "artificial intelligence", "cloud technology")
  for (let i = 0; i < normalizedWords.length - 1; i++) {
    const first = normalizedWords[i];
    const second = normalizedWords[i + 1];

    if (first.norm && second.norm) {
      const phraseKey = `${first.norm} ${second.norm}`;
      termCounts.set(phraseKey, (termCounts.get(phraseKey) || 0) + 1);
      if (!displayMap.has(phraseKey)) {
        displayMap.set(
          phraseKey,
          `${formatDisplayWord(first.norm)} ${formatDisplayWord(second.norm)}`
        );
      }
    }
  }

  // 4. Clean up isolated bi-grams vs standalone terms:
  // If a bigram only appeared once and wasn't flagged by AI, discard it to avoid clutter
  for (const [key, count] of termCounts.entries()) {
    if (key.includes(' ')) {
      const isAiKey = aiHighlights.some((h) => (h.text || '').toLowerCase().includes(key));
      if (count < 2 && !isAiKey) {
        termCounts.delete(key);
      } else {
        // If the compound phrase is kept, subtract from single word counts to avoid duplicate noise
        const [w1, w2] = key.split(' ');
        if (constituentCounts.get(w1) === count) termCounts.delete(w1);
        if (constituentCounts.get(w2) === count) termCounts.delete(w2);
      }
    }
  }

  if (termCounts.size === 0) return [];

  // 5. Rank terms by prominence/frequency
  const entries = Array.from(termCounts.entries());
  entries.sort((a, b) => b[1] - a[1]);

  const maxCount = entries[0][1];
  const minCount = entries[entries.length - 1][1];

  // 6. Calculate weights from actual term frequency (1 to 10)
  const results = entries.map(([norm, count], index) => {
    let weight;

    if (maxCount === minCount) {
      // If all extracted terms have identical count, distribute naturally so cloud has depth
      weight = Math.max(3, 8 - Math.floor((index / entries.length) * 5));
    } else if (maxCount <= 2) {
      weight = count === 2 ? 8 : 4;
    } else {
      // Proportional tiering: highest count reaches 10, single occurrences scale down to 2
      if (count === 1) {
        weight = maxCount > 3 ? 2 : 3;
      } else {
        const ratio = (count - 1) / (maxCount - 1);
        weight = Math.round(4 + ratio * 6); // scales count > 1 smoothly from 5 to 10
      }
    }

    return {
      term: displayMap.get(norm) || norm,
      weight: Math.min(10, Math.max(1, weight)),
      count,
    };
  });

  // Keep a clean, prominent selection (top 20 terms max)
  return results.slice(0, 20).map(({ term, weight }) => ({ term, weight }));
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
