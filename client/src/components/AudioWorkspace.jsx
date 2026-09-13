import React, { useState, useEffect } from 'react';

/**
 * AudioWorkspace Component
 * 
 * Represents SCREEN 2 of Echo Lens.
 * Handles the full audio lifecycle UI states:
 * 1. EMPTY - Blank staged workspace waiting for input
 * 2. RECORDING - Live recording animation and timer
 * 3. RECORDED_PREVIEW - Reviewing captured voice recording
 * 4. UPLOADED - Reviewing staged uploaded audio file
 * 5. PROCESSING - AI transcription & synthesis loading state
 * 6. ERROR - Graceful error handling state with retry option
 * 7. WORD_CLOUD - The primary visual artifact matching Google Stitch
 */
export default function AudioWorkspace({ initialMode = 'RECORD', onNavigateHome }) {
  // Determine initial state based on entry mode from Screen 1
  const [workspaceState, setWorkspaceState] = useState(() => {
    if (initialMode === 'RECORD') return 'RECORDING';
    if (initialMode === 'UPLOAD') return 'UPLOADED';
    if (initialMode === 'RESULT') return 'WORD_CLOUD';
    return 'EMPTY';
  });

  // Top tab selection: 'RESULT' (Word Cloud Result) vs 'WORKSPACE' (Audio Workspace)
  const [activeTab, setActiveTab] = useState(() => {
    return initialMode === 'RESULT' ? 'RESULT' : 'WORKSPACE';
  });

  // Simulated recording timer (seconds)
  const [recordSeconds, setRecordSeconds] = useState(42);

  // Selected sample file for upload state (allows testing normal flow vs error flow naturally)
  const [selectedFileType, setSelectedFileType] = useState('NORMAL'); // 'NORMAL' | 'CORRUPT'

  // Toast notification message
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-transition from PROCESSING to WORD_CLOUD or ERROR after realistic delay
  useEffect(() => {
    let timer;
    if (workspaceState === 'PROCESSING') {
      timer = setTimeout(() => {
        if (selectedFileType === 'CORRUPT') {
          setWorkspaceState('ERROR');
        } else {
          setWorkspaceState('WORD_CLOUD');
          setActiveTab('RESULT');
        }
      }, 2200);
    }
    return () => clearTimeout(timer);
  }, [workspaceState, selectedFileType]);

  // Recording timer increment simulation
  useEffect(() => {
    let interval;
    if (workspaceState === 'RECORDING') {
      interval = setInterval(() => {
        setRecordSeconds(prev => (prev < 600 ? prev + 1 : prev));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workspaceState]);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60).toString().padStart(2, '0');
    const remSecs = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${remSecs}`;
  };

  // Trigger toast message
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'RESULT') {
      setWorkspaceState('WORD_CLOUD');
    } else {
      // If we are coming from result tab back to workspace, show preview or staged
      if (workspaceState === 'WORD_CLOUD') {
        setWorkspaceState(initialMode === 'UPLOAD' ? 'UPLOADED' : 'RECORDED_PREVIEW');
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal-800 border border-accent/40 text-offwhite text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-header / Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-charcoal-800/80">
        {/* Left Tabs (Matches Stitch Screenshot 4 & 2) */}
        <div className="inline-flex p-1 bg-charcoal-900 border border-charcoal-800 rounded-xl">
          <button
            onClick={() => handleTabChange('RESULT')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'RESULT'
                ? 'bg-accent text-white shadow-sm'
                : 'text-offwhite-muted hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span>Word Cloud Result</span>
          </button>

          <button
            onClick={() => handleTabChange('WORKSPACE')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'WORKSPACE'
                ? 'bg-charcoal-850 text-white border border-charcoal-700/80'
                : 'text-offwhite-muted hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <span className="hidden sm:inline">Audio Workspace (Staged / Record)</span>
            <span className="sm:hidden">Audio Workspace</span>
          </button>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 self-start sm:self-auto">
          {workspaceState === 'WORD_CLOUD' && (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Recorded audio analyzed • 02m 18s • Ready to export</span>
            </div>
          )}
          {workspaceState === 'RECORDING' && (
            <div className="flex items-center space-x-2 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Recording live • {formatTime(recordSeconds)} / 10:00</span>
            </div>
          )}
          {workspaceState === 'RECORDED_PREVIEW' && (
            <div className="flex items-center space-x-2 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Audio Captured • {formatTime(recordSeconds)} • Ready to analyse</span>
            </div>
          )}
          {workspaceState === 'UPLOADED' && (
            <div className="flex items-center space-x-2 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span>File Staged • 14.2 MB • Ready to analyse</span>
            </div>
          )}
          {workspaceState === 'PROCESSING' && (
            <div className="flex items-center space-x-2 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Processing Audio • Synthesizing themes</span>
            </div>
          )}
          {workspaceState === 'ERROR' && (
            <div className="flex items-center space-x-2 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Analysis Failed • Action required</span>
            </div>
          )}
          {workspaceState === 'EMPTY' && (
            <div className="flex items-center space-x-2 text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              <span>Workspace Ready • No audio loaded</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Canvas / Content Container */}
      <div className="flex-1 my-6 flex flex-col justify-center">
        {/* ========================================================================= */}
        {/* STATE 7: WORD CLOUD RESULT (Matches Stitch Desktop & Mobile Screenshots) */}
        {/* ========================================================================= */}
        {workspaceState === 'WORD_CLOUD' && (
          <div className="w-full space-y-6">
            <div className="w-full bg-charcoal-900 border border-charcoal-800 rounded-2xl p-6 sm:p-12 md:p-16 flex flex-col items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden">
              {/* Subtle ambient accent glow in center */}
              <div className="absolute w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

              {/* Word Cloud Arrangement matching Google Stitch */}
              <div className="w-full max-w-4xl text-center space-y-4 sm:space-y-6 select-none relative z-10">
                {/* Row 1: Small terms */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-normal text-offwhite-muted">
                  <span className="hover:text-offwhite transition-colors">Trust</span>
                  <span className="hover:text-offwhite transition-colors">Async Work</span>
                  <span className="hover:text-offwhite transition-colors">1-on-1 Rhythms</span>
                  <span className="hover:text-offwhite transition-colors">Refactoring</span>
                  <span className="hover:text-offwhite transition-colors">Boundary Setting</span>
                </div>

                {/* Row 2: Medium & Hero Large Term */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2">
                  <span className="text-base sm:text-xl font-medium text-offwhite-muted">
                    Feedback Loops
                  </span>
                  <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent-light via-white to-accent-light">
                    CAREER TRAJECTORY
                  </span>
                </div>

                {/* Row 3: Medium tech term */}
                <div className="pt-1">
                  <span className="text-sm sm:text-base font-semibold text-offwhite-muted tracking-wide">
                    React Architecture
                  </span>
                </div>

                {/* Row 4: Primary Hero Term (CONFIDENCE) */}
                <div className="py-1 sm:py-2">
                  <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight">
                    CONFIDENCE
                  </h2>
                </div>

                {/* Row 5: Secondary Hero Term (SYSTEM DESIGN) */}
                <div>
                  <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-offwhite tracking-tight">
                    SYSTEM DESIGN
                  </h3>
                </div>

                {/* Row 6: Supporting Terms */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2">
                  <span className="text-sm sm:text-base font-medium text-offwhite-muted">
                    Sprint Cadence
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-white">
                    Active Listening
                  </span>
                  <span className="text-sm sm:text-base font-medium text-offwhite-muted">
                    Mentorship Goals
                  </span>
                </div>

                {/* Row 7: Subtle tags */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] sm:text-xs text-offwhite-subtle pt-2">
                  <span>Prioritisation</span>
                  <span>•</span>
                  <span>Delegation</span>
                  <span>•</span>
                  <span>Growth Framework</span>
                  <span>•</span>
                  <span>Accountability</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar matching Stitch: Note on left, Actions on right */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              {/* Helper Caption */}
              <div className="flex items-center space-x-2 text-xs text-offwhite-muted">
                <svg className="w-4 h-4 text-accent-light flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>Visual artifact ready for your mentorship wrap-up and notes.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onNavigateHome}
                  className="px-4 py-2.5 rounded-xl bg-charcoal-850 hover:bg-charcoal-800 text-offwhite font-medium text-xs sm:text-sm border border-charcoal-700/80 transition-colors flex items-center justify-center space-x-2 focus:outline-none"
                >
                  <svg className="w-4 h-4 text-offwhite-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Analyse Another</span>
                </button>

                <button
                  onClick={() => showToast('PNG export ready (Full canvas export will be generated in Step 3)')}
                  className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: RECORDING STATE (Active recording with soundwave and timer)     */}
        {/* ========================================================================= */}
        {workspaceState === 'RECORDING' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-charcoal-800 rounded-2xl p-8 sm:p-10 text-center space-y-8 shadow-2xl">
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Recording In Progress</span>
            </div>

            {/* Elapsed Timer Display */}
            <div className="space-y-1">
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono">
                {formatTime(recordSeconds)}
              </div>
              <p className="text-xs text-gray-500">Maximum duration: 10:00 minutes</p>
            </div>

            {/* Soundwave Animation Graphic */}
            <div className="flex items-center justify-center space-x-1.5 h-16 py-2">
              {[40, 70, 30, 85, 55, 95, 60, 40, 80, 50, 90, 65, 35, 75, 45, 80].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-accent rounded-full animate-soundwave"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${(i % 5) * 0.15}s`,
                  }}
                />
              ))}
            </div>

            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
              Speak clearly into your microphone. Tap stop when you finish your conversation.
            </p>

            {/* Recording Controls */}
            <div className="flex items-center justify-center space-x-4 pt-2">
              <button
                onClick={() => setWorkspaceState('EMPTY')}
                className="px-5 py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 font-medium text-sm border border-charcoal-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setWorkspaceState('RECORDED_PREVIEW')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all flex items-center space-x-2 shadow-lg shadow-rose-900/30"
              >
                <span className="w-3 h-3 rounded-sm bg-white" />
                <span>Stop Recording</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: RECORDED PREVIEW STATE (Review recorded audio before analysis) */}
        {/* ========================================================================= */}
        {workspaceState === 'RECORDED_PREVIEW' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-charcoal-800 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-charcoal-800">
              <div className="w-10 h-10 rounded-xl bg-accent-muted border border-accent/30 flex items-center justify-center text-accent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Voice Recording 01</h3>
                <p className="text-xs text-gray-400">Captured in browser • {formatTime(recordSeconds)} • WAV format</p>
              </div>
            </div>

            {/* Audio Player Scrubber Placeholder */}
            <div className="bg-charcoal-950/60 border border-charcoal-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono">00:00</span>
                <span className="font-mono">{formatTime(recordSeconds)}</span>
              </div>
              <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-accent h-full w-1/3 rounded-full" />
              </div>
              <div className="flex items-center justify-center space-x-4 pt-1">
                <button
                  onClick={() => showToast('Playing recorded audio preview')}
                  className="w-10 h-10 rounded-full bg-charcoal-800 hover:bg-charcoal-700 text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setRecordSeconds(0);
                  setWorkspaceState('RECORDING');
                }}
                className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 font-medium text-xs sm:text-sm border border-charcoal-700 transition-colors"
              >
                Re-record
              </button>

              <button
                onClick={() => setWorkspaceState('PROCESSING')}
                className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>Analyse Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: UPLOADED FILE STATE (File staged and ready for analysis)       */}
        {/* ========================================================================= */}
        {workspaceState === 'UPLOADED' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-charcoal-800 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-accent-muted border border-accent/30 flex items-center justify-center text-accent">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedFileType === 'NORMAL' ? 'mentorship-sync-session.mp3' : 'corrupted-recording-sample.wav'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedFileType === 'NORMAL' ? '14.2 MB • 02m 18s • MP3 Audio' : '0.4 MB • Corrupted header • WAV'}
                  </p>
                </div>
              </div>
            </div>

            {/* Audio Wave Preview Bar */}
            <div className="bg-charcoal-950/60 border border-charcoal-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono">00:00</span>
                <span className="font-mono">02:18</span>
              </div>
              <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-accent h-full w-2/5 rounded-full" />
              </div>
              <div className="flex items-center justify-center space-x-4 pt-1">
                <button
                  onClick={() => showToast('Playing staged audio preview')}
                  className="w-10 h-10 rounded-full bg-charcoal-800 hover:bg-charcoal-700 text-white flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Natural Error Simulation Choice for Review */}
            <div className="pt-2 pb-1 border-t border-charcoal-800/60">
              <label className="text-[11px] text-gray-500 block mb-1">Staged file sample:</label>
              <div className="flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedFileType('NORMAL')}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedFileType === 'NORMAL'
                      ? 'bg-charcoal-800 border-accent/60 text-white'
                      : 'bg-charcoal-950 border-charcoal-800 text-gray-400'
                  }`}
                >
                  Standard Audio File
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFileType('CORRUPT')}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    selectedFileType === 'CORRUPT'
                      ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                      : 'bg-charcoal-950 border-charcoal-800 text-gray-400'
                  }`}
                >
                  Corrupted File (Test Error State)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={onNavigateHome}
                className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 font-medium text-xs sm:text-sm border border-charcoal-700 transition-colors"
              >
                Choose Different File
              </button>

              <button
                onClick={() => setWorkspaceState('PROCESSING')}
                className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>Analyse Audio</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 5: PROCESSING STATE (Calm AI transcription & theme synthesis)      */}
        {/* ========================================================================= */}
        {workspaceState === 'PROCESSING' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-charcoal-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            {/* Spinning/pulsing synthesis indicator */}
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center text-accent">
                <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L12 22L9.5 9.5L12 2Z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Analysing Audio & Extracting Themes
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Transcribing speech data and synthesizing key discussion concepts with AI...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-charcoal-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-accent h-full w-4/5 rounded-full animate-pulse" />
            </div>

            {/* Subtle Step Status */}
            <div className="pt-2 text-[11px] text-gray-500 tracking-wide uppercase">
              Extracting Key Terms & Frequency
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 6: ERROR STATE (Clear, calm feedback with recovery action)          */}
        {/* ========================================================================= */}
        {workspaceState === 'ERROR' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-rose-900/40 rounded-2xl p-8 sm:p-10 space-y-6 shadow-2xl">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-white">Unable to process audio</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  The audio recording could not be transcribed or the volume levels were too low to detect speech. Please ensure the file is in a supported format and try again.
                </p>
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-charcoal-800">
              <button
                onClick={onNavigateHome}
                className="px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 font-medium text-xs sm:text-sm border border-charcoal-700 transition-colors"
              >
                Return to Start
              </button>
              <button
                onClick={() => {
                  setSelectedFileType('NORMAL');
                  setWorkspaceState('UPLOADED');
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs sm:text-sm shadow-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 1: EMPTY WORKSPACE STATE (Clean staged workspace ready for audio)  */}
        {/* ========================================================================= */}
        {workspaceState === 'EMPTY' && (
          <div className="w-full max-w-xl mx-auto bg-charcoal-900 border border-charcoal-800 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-gray-400 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">Audio Workspace Ready</h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Choose whether you want to record live voice audio now or stage an existing audio file.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setRecordSeconds(0);
                  setWorkspaceState('RECORDING');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium text-xs sm:text-sm border border-charcoal-700 flex items-center justify-center space-x-2 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Start Recording</span>
              </button>

              <button
                onClick={() => setWorkspaceState('UPLOADED')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Stage Audio File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer matching Google Stitch Desktop & Mobile */}
      <footer className="mt-auto pt-8 border-t border-charcoal-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
        <div>
          <span className="hidden sm:inline">Echo Lens — Thoughtful conversations transformed into clear insights.</span>
          <span className="sm:hidden">Echo Lens Mobile</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-500">
          <button onClick={() => showToast('Session Archive (Coming in later phase)')} className="hover:text-gray-300 transition-colors">
            Session Archive
          </button>
          <span>•</span>
          <button onClick={() => showToast('Mentor Guide (Reference documentation)')} className="hover:text-gray-300 transition-colors">
            Mentor Guide
          </button>
        </div>
      </footer>
    </div>
  );
}
