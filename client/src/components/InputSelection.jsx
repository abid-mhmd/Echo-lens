import React from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function InputSelection({ onSelectMode }) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    maxDurationReached,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    clearError,
  } = useAudioRecorder(600); // 10 minutes maximum duration limit

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
        {/* Card 1: Record Audio (Subtle Green Identity with Real Recording) */}
        <div className={`bg-[#0C101D] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
          isRecording
            ? isPaused
              ? 'border-amber-500/50 shadow-[0_0_35px_-5px_rgba(245,158,11,0.22)]'
              : 'border-emerald-500/60 shadow-[0_0_40px_-5px_rgba(16,185,129,0.3)]'
            : 'border-emerald-500/35 hover:border-emerald-500/50 shadow-[0_0_35px_-5px_rgba(16,185,129,0.18)] hover:shadow-[0_0_40px_-5px_rgba(16,185,129,0.25)]'
        }`}>
          {/* STATE A: LIVE OR PAUSED RECORDING IN PROGRESS */}
          {isRecording && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center relative shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors ${
                  isPaused 
                    ? 'bg-amber-950/50 border border-amber-500/40 text-amber-400' 
                    : 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                  {isPaused ? (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400" />
                  ) : (
                    <>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500" />
                    </>
                  )}
                </div>
                {isPaused ? (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/40 text-amber-400 text-xs font-semibold tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Recording Paused</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 text-xs font-semibold tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Recording Live</span>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Recording Audio</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {isPaused ? 'Recording is paused. Click resume to continue.' : 'Speak clearly into your microphone.'}
                </p>
              </div>

              {/* Timer and Animated Soundwave */}
              <div className={`bg-[#090D18]/80 border rounded-xl p-4 text-center space-y-2 transition-colors ${
                isPaused ? 'border-amber-500/25' : 'border-emerald-500/25'
              }`}>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                  {formatDuration(recordingTime)}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isPaused ? 'Paused • 10:00 limit preserved' : 'Max duration: 10:00'}
                </p>
                <div className="flex items-center justify-center space-x-1 h-7 pt-1">
                  {[35, 60, 40, 85, 55, 95, 65, 45, 80, 50, 90, 60, 40, 75].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isPaused
                          ? 'bg-amber-400/40 opacity-50'
                          : 'bg-emerald-400 animate-soundwave'
                      }`}
                      style={{
                        height: `${height}%`,
                        animationDelay: isPaused ? '0s' : `${(i % 5) * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Recording Controls: [ Pause/Resume ] [ Stop ] */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="py-3 px-4 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-100 hover:text-white font-medium text-sm border border-emerald-500/40 hover:border-emerald-400/60 shadow-md transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.99]"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-200 hover:text-white font-medium text-sm border border-amber-500/35 hover:border-amber-400/50 shadow-md transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40 active:scale-[0.99]"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="py-3 px-4 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-100 hover:text-white font-medium text-sm border border-rose-500/40 hover:border-rose-400/60 shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-[0.99]"
                  >
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
                    <span>Stop</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={discardRecording}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 focus:outline-none"
                >
                  Discard Recording
                </button>
              </div>
            </div>
          )}

          {/* STATE B: RECORDED PREVIEW (Audio Captured) */}
          {!isRecording && audioUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Audio Captured
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Audio Recorded</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Length: {formatDuration(recordingTime)} • Ready to review
                </p>
                {maxDurationReached && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    Maximum 10:00 limit reached.
                  </p>
                )}
              </div>

              {/* Audio Playback Control */}
              <div className="bg-[#090D18]/80 border border-emerald-500/25 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-medium text-emerald-400/90 block">Playback Audio</span>
                <audio
                  controls
                  src={audioUrl}
                  className="w-full h-9 rounded-lg"
                  controlsList="nodownload"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={discardRecording}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-xs sm:text-sm border border-slate-700/70 transition-all flex items-center justify-center space-x-2 focus:outline-none"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Discard & Record Again</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE C: IDLE (Initial / Ready to Record) */}
          {!isRecording && !audioUrl && (
            <>
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

                {/* Error Banner if microphone access fails */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="leading-relaxed">{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-rose-400 hover:text-rose-200 p-0.5 focus:outline-none"
                      aria-label="Dismiss error"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-100 hover:text-white font-medium text-sm border border-emerald-500/35 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.99]"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-0.5" />
                  <span>Start Recording</span>
                </button>
              </div>
            </>
          )}
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
