import React, { useState } from 'react';
import Header from './components/Header';
import InputSelection from './components/InputSelection';
import AudioWorkspace from './components/AudioWorkspace';

/**
 * Echo Lens App Component
 * 
 * Coordinates the two main screens:
 * - SCREEN 1: INPUT_SELECTION (Start / Input Selection)
 * - SCREEN 2: WORKSPACE (Audio Workspace / Results)
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('INPUT_SELECTION');
  const [workspaceMode, setWorkspaceMode] = useState('RECORD');

  // Triggered when user picks Record or Upload from Screen 1
  const handleSelectMode = (mode) => {
    setWorkspaceMode(mode);
    setCurrentScreen('WORKSPACE');
  };

  // Return to Screen 1 (e.g. Logo click or Analyse Another)
  const handleNavigateHome = () => {
    setCurrentScreen('INPUT_SELECTION');
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-offwhite flex flex-col selection:bg-accent/30 selection:text-white">
      {/* Top Application Header */}
      <Header screen={currentScreen} onReset={handleNavigateHome} />

      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'INPUT_SELECTION' ? (
          <InputSelection onSelectMode={handleSelectMode} />
        ) : (
          <AudioWorkspace
            initialMode={workspaceMode}
            onNavigateHome={handleNavigateHome}
          />
        )}
      </main>
    </div>
  );
}
