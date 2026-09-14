import React from 'react';

export default function InputSelection({ onSelectMode }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] relative">
      {/* Hero Section */}
      <div className="text-center max-w-xl mx-auto space-y-3 mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-[2.6rem] font-bold tracking-tight text-white leading-tight">
          Turn conversations into <br className="hidden sm:inline" />visual insight.
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-400 font-normal leading-relaxed max-w-md mx-auto">
          Give Echo Lens an audio recording and get a visual summary of what mattered.
        </p>
      </div>

      {/* Choice Cards (2-column desktop, 1-column mobile 390px) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Card 1: Record Audio (Subtle Green Identity) */}
        <div className="bg-[#0C101D] border border-emerald-500/35 hover:border-emerald-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_35px_-5px_rgba(16,185,129,0.18)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.25)] transition-all duration-300">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Record Audio</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Record audio directly in your browser with clear, natural voice capture.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <button
              onClick={() => onSelectMode('RECORD')}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-100 hover:text-white font-medium text-sm border border-emerald-500/35 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.99]"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-0.5" />
              <span>Start Recording</span>
            </button>
          </div>
        </div>

        {/* Card 2: Upload Audio (Subtle Purple/Violet Identity) */}
        <div className="bg-[#0C101D] border border-purple-500/35 hover:border-purple-500/50 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_35px_-5px_rgba(168,85,247,0.18)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.25)] transition-all duration-300">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Upload Audio</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Choose an audio file from your device to quickly generate insights.
              </p>
            </div>

            {/* Drop Zone Box - neutral/dark by default, purple accent on hover */}
            <div
              onClick={() => onSelectMode('UPLOAD')}
              className="border border-dashed border-slate-700/70 hover:border-purple-500/60 bg-slate-950/40 hover:bg-purple-950/20 rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group/drop flex flex-col items-center justify-center space-y-2"
            >
              <svg className="w-5 h-5 text-slate-400 group-hover/drop:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs text-slate-400 group-hover/drop:text-slate-200 font-medium transition-colors">
                Drop audio file here or click to browse
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => onSelectMode('UPLOAD')}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-100 hover:text-white font-medium text-sm border border-purple-500/35 hover:border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span>Choose File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Format & Limits Metadata */}
      <div className="mt-8 text-center text-xs text-slate-400 tracking-wide">
        Supports MP3, WAV, M4A, AAC, WEBM • Up to 25 MB • Up to 10 min
      </div>

      {/* Decorative Sparkle Accent */}
      <div className="fixed bottom-12 right-12 text-slate-500/30 pointer-events-none hidden lg:block">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14 9.5L21.5 12L14 14.5L12 22L10 14.5L2.5 12L10 9.5L12 2Z" />
        </svg>
      </div>
    </div>
  );
}
