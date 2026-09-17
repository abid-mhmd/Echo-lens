import React, { useState } from 'react';
import Header from './components/Header';
import InputSelection from './components/InputSelection';

/**
 * Echo Lens App Component
 * 
 * Renders the main Echo Lens application:
 * - Application header with branding
 * - Input selection (live browser recording & audio file upload)
 * - Audio analysis pipeline, word cloud visualization, and PNG export
 */
export default function App() {
  const [sessionKey, setSessionKey] = useState(0);

  const handleReset = () => {
    setSessionKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080B14] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,24,48,0.45),transparent_100%)] text-offwhite flex flex-col selection:bg-accent/30 selection:text-white relative">
      {/* Top Application Header */}
      <Header onReset={handleReset} />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        <InputSelection key={sessionKey} />
      </main>
    </div>
  );
}

