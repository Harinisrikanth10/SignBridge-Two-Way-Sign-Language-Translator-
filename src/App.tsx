import React, { useState, useEffect } from 'react';
import { SignLanguage } from './types/sign';
import { Navbar } from './components/Navbar';
import { HearingPanel } from './components/HearingPanel';
import { DeafPanel } from './components/DeafPanel';
import { SignTrainerPanel } from './components/SignTrainerPanel';
import { DictionaryModal } from './components/DictionaryModal';
import { Info, Sparkles, Download } from 'lucide-react';

export function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SignLanguage>('asl');
  const [activeSide, setActiveSide] = useState<'hearing' | 'deaf'>('hearing');
  const [activeView, setActiveView] = useState<'translator' | 'practice'>('translator');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState<boolean>(false);

  // Theme State: 'dark' (Black theme) or 'light' (Light theme)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('signbridge_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('signbridge_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleActiveSide = () => {
    setActiveSide(prev => (prev === 'hearing' ? 'deaf' : 'hearing'));
  };

  const handleExportTranscript = () => {
    const transcriptText = `SignBridge Conversation Log (${new Date().toLocaleString()})\nLanguage Mode: ${currentLanguage.toUpperCase()}\nTheme: ${theme.toUpperCase()}\n----------------------------------------\nHearing User: Hello thank you help\nDeaf User (Gesture Recognized): HELLO THANK YOU\n`;
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SignBridge-Transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        activeSide={activeSide}
        onToggleSide={toggleActiveSide}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-4">
        {/* Helper Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-slate-100/80 to-indigo-50/90 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/20 shadow-sm dark:shadow-md transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong className="text-slate-900 dark:text-white">
                  {activeView === 'translator' ? 'Translation Workflow:' : 'Sign Practice & Quiz Mode:'}
                </strong>{' '}
                {activeView === 'translator'
                  ? 'Left side translates Speech/Text to Sign Clips & 21-point Keypoint Canvas. Right side extracts MediaPipe hand landmarks in real-time to translate gestures to Speech.'
                  : 'Test your sign language skills in real-time! Match target handshapes in front of your webcam to build your streak.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTranscript}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              title="Download conversation transcript as TXT"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export Log</span>
            </button>

            <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700">
              {currentLanguage.toUpperCase()}
            </span>
          </div>
        </div>

        {/* View Router: Translator vs Practice & Quiz */}
        {activeView === 'translator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* Left Panel: Hearing Person */}
            <div className="h-full">
              <HearingPanel
                language={currentLanguage}
                isActive={activeSide === 'hearing'}
              />
            </div>

            {/* Right Panel: Deaf Person */}
            <div className="h-full">
              <DeafPanel
                language={currentLanguage}
                isActive={activeSide === 'deaf'}
              />
            </div>
          </div>
        ) : (
          <SignTrainerPanel language={currentLanguage} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-900 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <p>SignBridge — Supporting ASL & ISL client-side gesture recognition via MediaPipe Hands & Web Speech API.</p>
      </footer>

      {/* Dictionary Explorer Modal */}
      <DictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />
    </div>
  );
}

export default App;
