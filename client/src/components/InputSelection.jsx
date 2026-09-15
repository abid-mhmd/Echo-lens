import React, { useRef } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioUpload } from '../hooks/useAudioUpload';
import { useAudioAnalysis } from '../hooks/useAudioAnalysis';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function InputSelection({ onSelectMode }) {
  const fileInputRef = useRef(null);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    pausedAudioUrl,
    error,
    maxDurationReached,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    clearError,
  } = useAudioRecorder(600); // 10 minutes maximum duration limit

  const {
    uploadedFile,
    fileMetadata,
    isValidating,
    error: uploadError,
    isDragging,
    handleFileSelect,
    discardFile,
    clearError: clearUploadError,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useAudioUpload();

  const recordAnalysis = useAudioAnalysis();
  const uploadAnalysis = useAudioAnalysis();

  const handleAnalyzeRecordedAudio = async () => {
    if (recordAnalysis.isAnalyzing || !audioBlob) return;
    try {
      await recordAnalysis.analyzeAudio(audioBlob, {
        duration: recordingTime,
        filename: 'recorded-audio.webm',
      });
    } catch {
      // Analysis error captured in hook state
    }
  };

  const handleAnalyzeUploadedAudio = async () => {
    if (uploadAnalysis.isAnalyzing || !uploadedFile) return;
    try {
      await uploadAnalysis.analyzeAudio(uploadedFile, {
        duration: fileMetadata?.duration,
        filename: uploadedFile.name,
      });
    } catch {
      // Analysis error captured in hook state
    }
  };

  const handleDiscardRecording = () => {
    recordAnalysis.resetAnalysis();
    discardRecording();
  };

  const handleDiscardFile = () => {
    uploadAnalysis.resetAnalysis();
    discardFile();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] relative">
      {/* Hidden File Input for Native Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            uploadAnalysis.resetAnalysis();
            handleFileSelect(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />
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
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isPaused ? 'Recording Paused' : 'Recording Audio'}
                </h2>
                {!isPaused && (
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    Speak clearly into your microphone.
                  </p>
                )}
              </div>

              {/* Timer and Preview / Soundwave */}
              {isPaused ? (
                <div className="bg-[#090D18]/80 border border-amber-500/25 rounded-xl p-4 text-center space-y-3">
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                    {formatDuration(recordingTime)}
                  </div>
                  {pausedAudioUrl && (
                    <audio
                      controls
                      src={pausedAudioUrl}
                      className="w-full h-8 rounded-lg accent-amber-500"
                      controlsList="nodownload"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-[#090D18]/80 border border-emerald-500/25 rounded-xl p-4 text-center space-y-2">
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                    {formatDuration(recordingTime)}
                  </div>
                  <p className="text-[11px] text-slate-400">Max duration: 10:00</p>
                  <div className="flex items-center justify-center space-x-1 h-7 pt-1">
                    {[35, 60, 40, 85, 55, 95, 65, 45, 80, 50, 90, 60, 40, 75].map((height, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full transition-all bg-emerald-400 animate-soundwave"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${(i % 5) * 0.12}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

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
                  Audio Ready
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Audio Recorded</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  Duration: {formatDuration(recordingTime)}
                </p>
              </div>

              {/* Audio Playback Control */}
              <div className="bg-[#090D18]/80 border border-emerald-500/25 rounded-xl p-3.5">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full h-8 rounded-lg accent-emerald-500"
                  controlsList="nodownload"
                />
              </div>

              {/* Analysis Backend Error Message */}
              {recordAnalysis.analysisError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start justify-between space-x-2">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="leading-relaxed">{recordAnalysis.analysisError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={recordAnalysis.clearAnalysisError}
                    className="text-rose-400 hover:text-rose-200 p-0.5 focus:outline-none"
                    aria-label="Dismiss analysis error"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Analysis Temporary Success Confirmation */}
              {recordAnalysis.analysisResult && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-200 space-y-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center space-x-2 font-semibold text-emerald-300">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Audio Received & Validated by Backend</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 pl-6">
                    File: {recordAnalysis.analysisResult.file?.name} • Size: {Math.round((recordAnalysis.analysisResult.file?.size || 0) / 1024)} KB • Duration: {formatDuration(recordAnalysis.analysisResult.file?.duration || recordingTime)}
                  </p>
                </div>
              )}

              {/* Action Controls */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={handleAnalyzeRecordedAudio}
                  disabled={recordAnalysis.isAnalyzing}
                  className={`w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 border border-emerald-400/30 hover:border-emerald-400/50 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-[0.99] ${
                    recordAnalysis.isAnalyzing ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {recordAnalysis.isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Audio...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                      </svg>
                      <span>Analyse Audio</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDiscardRecording}
                  disabled={recordAnalysis.isAnalyzing}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Discard & Record Again
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
                  onClick={() => {
                    recordAnalysis.resetAnalysis();
                    startRecording();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-100 hover:text-white font-medium text-sm border border-emerald-500/35 hover:border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 active:scale-[0.99]"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mr-0.5" />
                  <span>Start Recording</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Card 2: Upload Audio (Subtle Purple/Violet Identity with Real Upload) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-[#0C101D] border rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
          fileMetadata
            ? 'border-purple-500/50 shadow-[0_0_35px_-5px_rgba(168,85,247,0.25)]'
            : isDragging
              ? 'border-purple-400 shadow-[0_0_40px_-5px_rgba(168,85,247,0.35)]'
              : 'border-purple-500/35 hover:border-purple-500/50 shadow-[0_0_35px_-5px_rgba(168,85,247,0.18)] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.25)]'
        }`}>
          {/* STATE A: VALID FILE STAGED */}
          {fileMetadata ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-400 border border-purple-800/40">
                  Audio Ready
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Audio File Ready</h2>
              </div>

              {/* File Info Box & Audio Player */}
              <div className="bg-[#090D18]/90 border border-purple-500/30 rounded-xl p-3.5 space-y-2.5">
                <div>
                  <p className="text-sm font-semibold text-white truncate" title={fileMetadata.name}>
                    {fileMetadata.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fileMetadata.sizeFormatted} • {fileMetadata.durationFormatted}
                  </p>
                </div>

                {/* Audio Preview Player */}
                <div className="pt-1">
                  <audio
                    controls
                    src={fileMetadata.previewUrl}
                    className="w-full h-8 rounded-lg accent-purple-500"
                    controlsList="nodownload"
                  />
                </div>
              </div>

              {/* Analysis Backend Error Message */}
              {uploadAnalysis.analysisError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start justify-between space-x-2">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="leading-relaxed">{uploadAnalysis.analysisError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={uploadAnalysis.clearAnalysisError}
                    className="text-rose-400 hover:text-rose-200 p-0.5 focus:outline-none"
                    aria-label="Dismiss analysis error"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Analysis Temporary Success Confirmation */}
              {uploadAnalysis.analysisResult && (
                <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/40 text-xs text-purple-200 space-y-1.5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  <div className="flex items-center space-x-2 font-semibold text-purple-300">
                    <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Audio Received & Validated by Backend</span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 pl-6">
                    File: {uploadAnalysis.analysisResult.file?.name} • Size: {Math.round((uploadAnalysis.analysisResult.file?.size || 0) / 1024)} KB • Duration: {formatDuration(uploadAnalysis.analysisResult.file?.duration || fileMetadata?.duration || 0)}
                  </p>
                </div>
              )}

              {/* Action Controls */}
              <div className="pt-2 space-y-2.5">
                {/* Primary Action: Analyse Audio */}
                <button
                  type="button"
                  onClick={handleAnalyzeUploadedAudio}
                  disabled={uploadAnalysis.isAnalyzing}
                  className={`w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-950/50 hover:shadow-purple-900/60 border border-purple-400/30 hover:border-purple-400/50 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:scale-[0.99] ${
                    uploadAnalysis.isAnalyzing ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadAnalysis.isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Audio...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-purple-200" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                      </svg>
                      <span>Analyse Audio</span>
                    </>
                  )}
                </button>

                {/* Secondary Actions: Replace File & Remove */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={uploadAnalysis.isAnalyzing}
                    onClick={() => {
                      uploadAnalysis.resetAnalysis();
                      fileInputRef.current?.click();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/70 transition-all flex items-center justify-center space-x-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Replace File</span>
                  </button>

                  <button
                    type="button"
                    disabled={uploadAnalysis.isAnalyzing}
                    onClick={handleDiscardFile}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-rose-300 font-medium text-xs border border-slate-700/70 hover:border-rose-800/50 transition-all flex items-center justify-center space-x-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STATE B: DROP ZONE & FILE SELECTION */
            <>
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

                {/* Error Banner if upload validation fails */}
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="leading-relaxed">{uploadError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearUploadError}
                      className="text-rose-400 hover:text-rose-200 p-0.5 focus:outline-none"
                      aria-label="Dismiss error"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Drop Zone Box - neutral/dark by default, purple accent on hover/drag */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 group/drop flex flex-col items-center justify-center space-y-2 ${
                    isDragging
                      ? 'border-purple-500 bg-purple-950/30'
                      : 'border-slate-700/70 hover:border-purple-500/60 bg-slate-950/40 hover:bg-purple-950/20'
                  }`}
                >
                  {isValidating ? (
                    <div className="flex flex-col items-center space-y-2 py-2">
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-purple-300 font-medium">Validating audio file...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-slate-400 group-hover/drop:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-slate-400 group-hover/drop:text-slate-200 font-medium transition-colors">
                        {isDragging ? 'Drop audio file here' : 'Drop audio file here or click to browse'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-100 hover:text-white font-medium text-sm border border-purple-500/35 hover:border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>Choose File</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Format & Limits Metadata */}
      <div className="mt-8 text-center text-xs text-slate-400 tracking-wide">
        Supports MP3, WAV, M4A, AAC, OGG, WEBM, FLAC • Up to 25 MB • Up to 10 min
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
