import { AssemblyAI } from 'assemblyai';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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
 * Initialize AssemblyAI client from configured environment
 */
function getAssemblyAIClient() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();

  if (!apiKey) {
    throw new AppError(
      'AssemblyAI API service is not configured. Please set the ASSEMBLYAI_API_KEY environment variable on the server.',
      503
    );
  }

  return new AssemblyAI({ apiKey });
}

/**
 * Obvious spoken acoustic hesitation fillers.
 * Safe to deterministically remove without risk to semantic topics.
 */
export const SPOKEN_FILLERS = new Set([
  'um', 'uh', 'erm', 'hmm', 'mhm', 'ah', 'oh', 'huh',
]);

/**
 * Common conversational filler words when occurring as standalone terms.
 */
export const CONVERSATIONAL_FILLERS = new Set([
  'basically', 'actually', 'really', 'just', 'well', 'nowadays',
]);

/**
 * Multi-word conversational discourse phrases.
 */
export const DISCOURSE_PHRASES = new Set([
  'you know', 'i mean', 'you see',
]);

/**
 * Common conversational contractions (negative & pronoun contractions).
 */
export const CONVERSATIONAL_CONTRACTIONS = new Set([
  // Negation contractions
  "don't", "dont", "doesn't", "doesnt", "didn't", "didnt",
  "can't", "cant", "couldn't", "couldnt",
  "won't", "wont", "wouldn't", "wouldnt", "shouldn't", "shouldnt",
  "isn't", "isnt", "aren't", "arent", "wasn't", "wasnt", "weren't", "werent",
  "hasn't", "hasnt", "haven't", "havent", "hadn't", "hadnt",

  // Pronoun + auxiliary contractions
  "i'm", "im", "i've", "ive", "i'd", "id", "i'll", "ill",
  "you're", "youre", "you've", "youve", "you'd", "youd", "you'll", "youll",
  "we're", "weve", "we've", "we'd", "wed", "we'll",
  "they're", "theyre", "they've", "theyve", "they'd", "theyd", "they'll", "theyll",
  "he's", "hes", "he'd", "hed", "he'll", "hell",
  "she's", "shes", "she'd", "shed", "she'll",
  "it's", "its", "that's", "thats", "there's", "theres",
  "what's", "whats", "who's", "whos", "how's", "hows", "let's", "lets",
]);

/**
 * Small, defensible set of closed-class grammatical particles.
 * Only basic articles, conjunctions, prepositions, and basic auxiliaries/pronouns.
 * Excludes context-dependent words (like, right, still, everything, anything, etc.).
 */
export const GRAMMATICAL_STOPWORDS = new Set([
  // Articles
  'a', 'an', 'the',

  // Basic conjunctions
  'and', 'or', 'but', 'nor', 'so',

  // Basic prepositions
  'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from',

  // Basic pronouns & auxiliaries
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that',
  'is', 'are', 'was', 'were', 'be', 'been',
]);

/**
 * Combined set of terms that should not be admitted as standalone Word Cloud topics.
 */
export const SAFE_STOP_WORDS = new Set([
  ...SPOKEN_FILLERS,
  ...CONVERSATIONAL_FILLERS,
  ...CONVERSATIONAL_CONTRACTIONS,
  ...GRAMMATICAL_STOPWORDS,
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
export function cleanPunctuation(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
}

/**
 * Safely normalizes an English word from plural to singular.
 * Strictly protects NON_PLURALS and avoids aggressive stemming.
 */
export function safeSingularize(word) {
  const lower = word.toLowerCase();

  // Preserve safe stopwords, contractions, and spoken fillers
  if (SAFE_STOP_WORDS.has(lower)) return lower;

  // Possessive nouns: student's -> student, company's -> company
  if (lower.endsWith("'s")) {
    return lower.slice(0, -2);
  }

  // Explicit non-plurals: never alter
  if (NON_PLURALS.has(lower)) return lower;

  // Specific irregular plurals for protected categories
  if (lower === 'lenses') return 'lens';
  if (lower === 'analyses') return 'analysis';
  if (lower === 'crises') return 'crisis';
  if (lower === 'statuses') return 'status';
  if (lower === 'focuses') return 'focus';
  if (lower.endsWith('sses')) return lower.slice(0, -2); // classes -> class, processes -> process, businesses -> business

  // Short words (<= 3 chars, e.g. 'gas', 'bus', 'yes') or non-plural endings ('ss', 'us', 'is')
  if (lower.length <= 3) return lower;
  if (lower.endsWith('ss') || lower.endsWith('us') || lower.endsWith('is')) return lower;

  // English words ending in 's' that are adverbs/particles and not plurals
  if (lower === 'always' || lower === 'sometimes' || lower === 'perhaps' || lower === 'nowadays') {
    return lower;
  }

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

  // developers -> developer, systems -> system, students -> student, projects -> project
  if (lower.endsWith('s') && !lower.endsWith('ss')) {
    return lower.slice(0, -1);
  }

  return lower;
}

/**
 * Formats a clean display term (Title Case, uppercase for acronyms)
 */
export function formatDisplayTerm(term) {
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
 * Tokenizes and normalizes the full transcript using the exact same cleaning
 * and safe singularization rules used for AI highlight candidates.
 */
export function tokenizeAndNormalize(text) {
  if (!text || typeof text !== 'string') return [];
  const sanitized = text
    .replace(/[’‘]/g, "'")
    .replace(/[\u2014\u2013]|--/g, ' ');

  const rawTokens = sanitized.split(/\s+/).filter(Boolean);
  const normalizedTokens = [];

  for (const raw of rawTokens) {
    const cleaned = cleanPunctuation(raw);
    if (!cleaned) continue;
    const normalized = safeSingularize(cleaned);
    if (normalized) {
      normalizedTokens.push(normalized);
    }
  }

  return normalizedTokens;
}

/**
 * Normalizes an AI highlight candidate into constituent normalized tokens.
 * Trims leading/trailing grammatical particles and validates meaningful topic content.
 */
export function normalizeCandidateTokens(rawPhrase) {
  if (!rawPhrase || typeof rawPhrase !== 'string') return null;
  const sanitized = rawPhrase
    .replace(/[’‘]/g, "'")
    .replace(/[\u2014\u2013]|--/g, ' ');

  const rawTokens = sanitized.split(/\s+/).filter(Boolean);
  const tokens = [];

  for (const raw of rawTokens) {
    const cleaned = cleanPunctuation(raw);
    if (!cleaned) continue;
    const normalized = safeSingularize(cleaned);
    if (normalized) {
      tokens.push(normalized);
    }
  }

  if (tokens.length === 0) return null;

  // Check if candidate is a known conversational discourse phrase
  const candidateKey = tokens.join(' ');
  if (DISCOURSE_PHRASES.has(candidateKey)) {
    return null;
  }

  // Trim leading & trailing grammatical particles from candidate phrases
  // (e.g. "the machine learning" -> "machine learning", "in artificial intelligence" -> "artificial intelligence")
  while (tokens.length > 0 && GRAMMATICAL_STOPWORDS.has(tokens[0])) {
    tokens.shift();
  }
  while (tokens.length > 0 && GRAMMATICAL_STOPWORDS.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  if (tokens.length === 0) return null;

  // Reject candidate if remaining single token is a filler, contraction, or grammatical word
  if (tokens.length === 1 && SAFE_STOP_WORDS.has(tokens[0])) {
    return null;
  }

  // Ensure candidate contains at least one meaningful token that is not a filler or grammatical particle
  const hasMeaningful = tokens.some(
    (w) => w.length >= 2 && !SAFE_STOP_WORDS.has(w)
  );
  if (!hasMeaningful) return null;

  return tokens;
}

/**
 * Counts exact occurrences of a normalized multi-word phrase in the normalized transcript token sequence.
 * Avoids false substring matches and accurately supports multi-word AI highlights.
 */
export function countPhraseOccurrences(phraseTokens, transcriptTokens) {
  if (!phraseTokens || phraseTokens.length === 0 || !transcriptTokens || transcriptTokens.length === 0) {
    return 0;
  }
  const pLen = phraseTokens.length;
  if (pLen === 1) {
    let count = 0;
    const target = phraseTokens[0];
    for (let i = 0; i < transcriptTokens.length; i++) {
      if (transcriptTokens[i] === target) count++;
    }
    return count;
  }

  if (pLen > transcriptTokens.length) return 0;

  let count = 0;
  for (let i = 0; i <= transcriptTokens.length - pLen; i++) {
    let match = true;
    for (let j = 0; j < pLen; j++) {
      if (transcriptTokens[i + j] !== phraseTokens[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      count++;
      i += pLen - 1; // Advance past matched phrase to avoid overlapping counts
    }
  }
  return count;
}

/**
 * Extracts and weights meaningful discussion concepts using AssemblyAI's AI key phrases.
 * Pipeline:
 * 1. Raw AssemblyAI transcript -> tokenize & clean punctuation -> safe normalization
 * 2. Generate normalized transcript frequency map
 * 3. Use AssemblyAI auto_highlights ONLY to identify prominent candidate terms
 * 4. Look up each candidate's REAL frequency from the normalized transcript
 * 5. Calculate visual weight separately: count !== weight
 */
export function extractTermsFromTranscript(transcriptText, aiHighlights = []) {
  if (!transcriptText || typeof transcriptText !== 'string') return [];
  if (!Array.isArray(aiHighlights) || aiHighlights.length === 0) return [];

  // Step 1: Tokenize & normalize transcript
  const transcriptTokens = tokenizeAndNormalize(transcriptText);
  if (transcriptTokens.length === 0) return [];

  // Step 2: Build normalized frequency map for single terms
  const frequencyMap = new Map();
  for (const token of transcriptTokens) {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  }

  // Step 3 & 4: Process AI highlights to identify prominent candidates & look up actual frequencies
  const candidates = new Map(); // normalizedKey -> { displayTerm, count, aiRank }

  for (const h of aiHighlights) {
    const rawPhrase = typeof h === 'string' ? h : h?.text;
    if (!rawPhrase) continue;

    const phraseTokens = normalizeCandidateTokens(rawPhrase);
    if (!phraseTokens || phraseTokens.length === 0) continue;

    const normalizedKey = phraseTokens.join(' ');

    // Actual occurrence count from normalized transcript (single-word or multi-word phrase)
    const count = phraseTokens.length === 1
      ? (frequencyMap.get(phraseTokens[0]) || 0)
      : countPhraseOccurrences(phraseTokens, transcriptTokens);

    // If an AI highlight has no matching occurrence in the normalized transcript,
    // do NOT fabricate a count. Ignore that candidate.
    if (count <= 0) continue;

    const aiRank = typeof h?.rank === 'number' && !isNaN(h.rank) ? h.rank : 0.5;

    if (!candidates.has(normalizedKey)) {
      candidates.set(normalizedKey, {
        displayTerm: formatDisplayTerm(normalizedKey),
        count,
        aiRank,
      });
    } else {
      const existing = candidates.get(normalizedKey);
      // Frequency is fixed from transcript; preserve highest AI rank if highlighted multiple times
      existing.count = count;
      existing.aiRank = Math.max(existing.aiRank, aiRank);
    }
  }

  // If AI key phrases yielded no matching terms in transcript, do not fabricate
  if (candidates.size === 0) return [];

  const candidateList = Array.from(candidates.values());

  // Step 5: Rank terms by AI prominence/rank as primary signal, occurrence frequency as secondary
  candidateList.sort((a, b) => {
    if (b.aiRank !== a.aiRank) {
      return b.aiRank - a.aiRank;
    }
    return b.count - a.count;
  });

  const topTerms = candidateList.slice(0, 20);
  const maxRank = Math.max(...topTerms.map((t) => t.aiRank));
  const minRank = Math.min(...topTerms.map((t) => t.aiRank));
  const maxCount = Math.max(...topTerms.map((t) => t.count));
  const minCount = Math.min(...topTerms.map((t) => t.count));

  // Step 6: Calculate visual weights (1 - 10) for Word Cloud sizing
  // count !== weight
  // count = actual mathematical frequency in normalized transcript
  // weight = visual prominence used by Word Cloud (1 - 10)
  return topTerms.map((item) => {
    let weight;

    if (maxRank === minRank) {
      if (maxCount === minCount) {
        weight = 6;
      } else {
        const countRatio = (item.count - minCount) / (maxCount - minCount);
        weight = Math.round(1 + countRatio * 9); // 1 to 10
      }
    } else {
      const rankRatio = (item.aiRank - minRank) / (maxRank - minRank);
      const countRatio = maxCount > minCount ? (item.count - minCount) / (maxCount - minCount) : 0;
      // Prominence is driven primarily by AI rank (70%), with frequency as supporting signal (30%)
      const prominence = 0.7 * rankRatio + 0.3 * countRatio;
      weight = Math.round(1 + prominence * 9); // Spans 1 to 10 for meaningful visual differences
    }

    return {
      term: item.displayTerm,
      count: item.count, // Actual mathematically accurate occurrence count
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

    // Transcribe with AI auto_highlights and without spoken disfluencies
    const transcript = await client.transcripts.transcribe({
      audio: tempFilePath,
      auto_highlights: true,
      disfluencies: false,
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed.');
    }

    return {
      text: (transcript.text || '').trim(),
      highlights: transcript.auto_highlights_result?.results || [],
    };
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
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

    // 2. Validate meaningful speech presence (Case A)
    if (
      !transcriptText ||
      transcriptText.replace(/[^a-zA-Z0-9]/g, '').length < 2
    ) {
      throw new AppError(
        'No meaningful speech detected in the audio. Please check your microphone and speak clearly.',
        422
      );
    }

    // 3. Normalized Term Extraction using AI highlights (Case B)
    const validatedTerms = extractTermsFromTranscript(transcriptText, highlights);

    if (validatedTerms.length === 0) {
      throw new AppError(
        'No prominent discussion topics could be identified from the audio. Please try speaking longer or discussing specific topics.',
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
