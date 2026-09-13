import React from 'react';

export default function InputSelection({ onSelectMode }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          Turn conversations into visual insight.
        </h1>
        <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed">
          Give Echo Lens an audio recording and get a visual summary of what mattered.
        </p>
      </div>

      {/* Choice Cards (2-column desktop, 1-column mobile 390px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Card 1: Record Audio */}
        <div className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-black/40 transition-all duration-200">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center text-accent-light">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-offwhite tracking-tight">Record Audio</h2>
              <p className="text-xs sm:text-sm text-offwhite-muted mt-1.5 leading-relaxed">
                Record audio directly in your browser with clear, natural voice capture.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <button
              onClick={() => onSelectMode('RECORD')}
              className="w-full py-3 px-4 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-offwhite font-medium text-sm border border-charcoal-700/70 hover:border-charcoal-700 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Start Recording</span>
            </button>
          </div>
        </div>

        {/* Card 2: Upload Audio */}
        <div className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-black/40 transition-all duration-200">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center text-accent-light">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-offwhite tracking-tight">Upload Audio</h2>
              <p className="text-xs sm:text-sm text-offwhite-muted mt-1.5 leading-relaxed">
                Choose an audio file from your device to quickly generate insights.
              </p>
            </div>

            {/* Drop Zone Box */}
            <div
              onClick={() => onSelectMode('UPLOAD')}
              className="border border-dashed border-charcoal-700 hover:border-accent/50 bg-charcoal-950/60 hover:bg-charcoal-950/80 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center space-y-2"
            >
              <svg className="w-5 h-5 text-offwhite-subtle group-hover:text-accent-light transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs text-offwhite-muted group-hover:text-offwhite transition-colors">
                Drop audio file here or click to browse
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => onSelectMode('UPLOAD')}
              className="w-full py-3 px-4 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-offwhite font-medium text-sm border border-charcoal-700/70 hover:border-charcoal-700 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <svg className="w-4 h-4 text-offwhite-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Choose File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Format & Limits Metadata */}
      <div className="mt-8 text-center text-xs text-offwhite-subtle tracking-wide">
        Supports MP3, WAV, M4A, AAC, WEBM • Up to 25 MB • Up to 10 min
      </div>

      {/* Bottom Page Subtle Footer */}
      <div className="mt-auto pt-12 pb-4 text-center text-[11px] text-offwhite-subtle/70">
        Echo Lens — Designed for mentors and thoughtful listeners.
      </div>
    </div>
  );
}
