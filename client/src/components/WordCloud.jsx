import React, { useMemo, useState } from 'react';

/**
 * Maps an integer weight (1 - 10) to responsive font size and styling tiers.
 * Guarantees readable typography and prevents horizontal overflow on small screens (390px).
 */
function getWeightTier(weight) {
  const w = Math.min(10, Math.max(1, parseInt(weight, 10) || 1));

  if (w >= 9) {
    return {
      sizeClass: 'text-2xl sm:text-3xl md:text-5xl font-black tracking-tight',
      colorClass: 'text-white bg-gradient-to-r from-accent-light via-white to-accent-light bg-clip-text text-transparent',
      bgClass: 'bg-accent/20 border-accent/50 shadow-[0_0_25px_rgba(93,95,239,0.3)] hover:border-accent',
      paddingClass: 'px-4 py-2 sm:px-5 sm:py-2.5',
      badgeClass: 'bg-accent text-white',
    };
  }
  if (w >= 7) {
    return {
      sizeClass: 'text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight',
      colorClass: 'text-white',
      bgClass: 'bg-charcoal-800/90 border-charcoal-700 shadow-md hover:border-accent/40',
      paddingClass: 'px-3.5 py-1.5 sm:px-4 sm:py-2',
      badgeClass: 'bg-charcoal-700 text-slate-200',
    };
  }
  if (w >= 5) {
    return {
      sizeClass: 'text-lg sm:text-xl md:text-2xl font-bold',
      colorClass: 'text-slate-100',
      bgClass: 'bg-charcoal-850/70 border-charcoal-750 hover:border-slate-600',
      paddingClass: 'px-3 py-1 sm:px-3.5 sm:py-1.5',
      badgeClass: 'bg-charcoal-800 text-slate-300',
    };
  }
  if (w >= 3) {
    return {
      sizeClass: 'text-sm sm:text-base md:text-lg font-medium',
      colorClass: 'text-slate-300',
      bgClass: 'bg-charcoal-900/60 border-charcoal-800 hover:border-slate-700',
      paddingClass: 'px-2.5 py-1 sm:px-3 sm:py-1',
      badgeClass: 'bg-charcoal-850 text-slate-400',
    };
  }
  return {
    sizeClass: 'text-xs sm:text-sm font-normal',
    colorClass: 'text-slate-400',
    bgClass: 'bg-charcoal-950/40 border-charcoal-800/60 hover:border-slate-700',
    paddingClass: 'px-2 py-0.5 sm:px-2.5 sm:py-1',
    badgeClass: 'bg-charcoal-900 text-slate-500',
  };
}

/**
 * Organically distributes terms so that the highest weighted concepts
 * anchor the center of the cloud with supporting terms wrapping around them.
 */
function organizeCloudLayout(terms) {
  if (!terms || terms.length === 0) return [];
  const sorted = [...terms].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const arranged = [];

  sorted.forEach((item, index) => {
    if (index % 2 === 0) {
      arranged.push(item);
    } else {
      arranged.unshift(item);
    }
  });

  return arranged;
}

/**
 * WordCloud Component
 * Renders the prominent discussion terms with visual weight hierarchy, dark Echo Lens styling,
 * responsive wrapping, and clean transcript inspection.
 */
export default function WordCloud({ result, onReset }) {
  const [showTranscript, setShowTranscript] = useState(false);

  const rawTerms = useMemo(() => {
    return Array.isArray(result?.terms) ? result.terms : [];
  }, [result]);

  const displayTerms = useMemo(() => {
    return organizeCloudLayout(rawTerms);
  }, [rawTerms]);

  const transcript = result?.transcript || '';
  const meta = result?.meta || {};

  // STATE 4: No terms returned by analysis
  if (rawTerms.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 bg-[#0C101D] border border-charcoal-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-slate-400 mx-auto">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No prominent terms extracted</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The audio was successfully transcribed, but no recurring key concepts were identified in the speech.
          </p>
        </div>
        {transcript && (
          <div className="pt-2">
            <div className="text-left bg-[#090D18] border border-charcoal-800 rounded-xl p-4 text-xs text-slate-300 font-mono max-h-40 overflow-y-auto">
              <span className="text-slate-500 block mb-1 font-sans text-[11px] uppercase tracking-wider font-semibold">Transcript:</span>
              "{transcript}"
            </div>
          </div>
        )}
        {onReset && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onReset}
              className="px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-semibold border border-charcoal-700 transition-colors"
            >
              Analyse Another Audio
            </button>
          </div>
        )}
      </div>
    );
  }

  // STATE 3: Successful Analysis Word Cloud
  return (
    <section aria-label="Analysis Word Cloud" className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 space-y-6">
      {/* Header Bar with Key Metrics & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-charcoal-800/80 px-1">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Prominent Concepts
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/20 border border-accent/40 text-accent-light">
              {rawTerms.length} {rawTerms.length === 1 ? 'term' : 'terms'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Terms weighted by conversational prominence and frequency
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-3 py-1.5 rounded-lg bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center space-x-1.5 focus:outline-none"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{showTranscript ? 'Hide Transcript' : 'View Transcript'}</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5 focus:outline-none"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>New Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Cloud Canvas Card */}
      <div className="w-full bg-[#0C101D] border border-charcoal-800 rounded-2xl p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Word Cloud Flex Container */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4.5 relative z-10 select-none">
          {displayTerms.map((item, idx) => {
            const tier = getWeightTier(item.weight);
            return (
              <div
                key={`${item.term}-${idx}`}
                className={`group inline-flex items-center rounded-xl sm:rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 cursor-default break-words max-w-full ${tier.bgClass} ${tier.paddingClass}`}
                title={`Term: "${item.term}" (Weight: ${item.weight}/10)`}
              >
                <span className={`${tier.sizeClass} ${tier.colorClass} leading-tight text-center break-words`}>
                  {item.term}
                </span>
                <span
                  className={`ml-1.5 sm:ml-2 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold leading-none opacity-70 group-hover:opacity-100 transition-opacity ${tier.badgeClass}`}
                  aria-label={`Weight ${item.weight}`}
                >
                  {item.weight}
                </span>
              </div>
            );
          })}
        </div>

        {/* Metadata Footer in Card */}
        {(meta.filename || meta.duration) && (
          <div className="mt-8 pt-4 border-t border-charcoal-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <span>
              Source: <span className="text-slate-400 font-mono">{meta.filename || 'audio-input'}</span>
            </span>
            {meta.duration && (
              <span>
                Audio Length: <span className="text-slate-400 font-mono">{meta.duration}s</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expandable Transcript Panel */}
      {showTranscript && transcript && (
        <div className="bg-[#090D18] border border-charcoal-800 rounded-xl p-5 sm:p-6 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-charcoal-800/60">
            <span className="font-semibold text-white tracking-wide text-xs uppercase text-slate-400">
              Full Audio Transcript
            </span>
            <span className="text-[11px] text-slate-500">
              Transcribed with Google Gemini
            </span>
          </div>
          <p className="font-mono text-xs sm:text-[13px] text-slate-300 whitespace-pre-wrap leading-relaxed pt-1">
            "{transcript}"
          </p>
        </div>
      )}
    </section>
  );
}
