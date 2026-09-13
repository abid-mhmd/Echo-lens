import React from 'react';

export default function Header({ screen, onReset }) {
  return (
    <header className="w-full border-b border-charcoal-800 bg-charcoal-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo Branding */}
        <button
          onClick={onReset}
          className="flex items-center space-x-2.5 text-left group focus:outline-none"
        >
          <div className="w-7 h-7 rounded-lg bg-accent-muted border border-accent/25 flex items-center justify-center text-accent-light group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white group-hover:text-accent-light transition-colors">
            Echo Lens
          </span>
        </button>

        {/* Header Right Status / Metadata */}
        <div className="flex items-center space-x-3 text-xs text-offwhite-muted">
          <span className="hidden md:inline-block font-medium tracking-wide text-xs text-offwhite-subtle">
            Audio Workspace & Synthesis
          </span>
          {screen === 'WORKSPACE' && (
            <span className="inline-flex md:hidden items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
              Active session
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
