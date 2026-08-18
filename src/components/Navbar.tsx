import React from 'react';
import { SignLanguage } from '../types/sign';
import { Sparkles, BookOpen, Volume2, Video, ArrowLeftRight, Award, Layers, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentLanguage: SignLanguage;
  onLanguageChange: (lang: SignLanguage) => void;
  activeSide: 'hearing' | 'deaf';
  onToggleSide: () => void;
  onOpenDictionary: () => void;
  activeView: 'translator' | 'practice';
  onViewChange: (view: 'translator' | 'practice') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onLanguageChange,
  activeSide,
  onToggleSide,
  onOpenDictionary,
  activeView,
  onViewChange,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-600 shadow-lg shadow-brand-500/25">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                SignBridge
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Two-Way Accessible Sign Language Translation & Trainer
            </p>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center bg-slate-200/70 dark:bg-slate-950 p-1 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-inner transition-colors">
          <button
            onClick={() => onViewChange('translator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'translator'
                ? 'bg-gradient-to-r from-indigo-600 to-brand-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2-Way Translator</span>
          </button>

          <button
            onClick={() => onViewChange('practice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'practice'
                ? 'bg-gradient-to-r from-amber-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Practice & Quiz</span>
          </button>
        </div>

        {/* Controls Bar: Language Selector, Theme Switcher & Mode Switch */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sign Language Selector */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-900/90 rounded-xl p-1 border border-slate-300/80 dark:border-slate-800 shadow-inner transition-colors">
            <button
              onClick={() => onLanguageChange('asl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentLanguage === 'asl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-800/50'
              }`}
              title="American Sign Language (One-handed fingerspelling)"
            >
              <span className="text-sm">🇺🇸</span>
              <span>ASL</span>
            </button>

            <button
              onClick={() => onLanguageChange('isl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentLanguage === 'isl'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-800/50'
              }`}
              title="Indian Sign Language (Two-handed fingerspelling)"
            >
              <span className="text-sm">🇮🇳</span>
              <span>ISL</span>
            </button>
          </div>

          {/* Theme Toggle Button (Light vs Black Mode) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Black / Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline">Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="hidden sm:inline">Black Theme</span>
              </>
            )}
          </button>

          {/* Quick Swap Active Focus Side */}
          {activeView === 'translator' && (
            <button
              onClick={onToggleSide}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
              title="Toggle active focus between Hearing and Deaf interfaces"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Focus:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-300 capitalize">{activeSide} Side</span>
            </button>
          )}

          {/* Dictionary Explorer Button */}
          <button
            onClick={onOpenDictionary}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-850 border border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/50 text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Sign Library</span>
          </button>
        </div>
      </div>
    </header>
  );
};
