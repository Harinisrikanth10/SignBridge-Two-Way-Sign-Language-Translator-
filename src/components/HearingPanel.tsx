import React, { useState } from 'react';
import { SignLanguage, TranslationToken } from '../types/sign';
import { translationEngine } from '../services/translationEngine';
import { speechService } from '../services/speechService';
import { SignPlayer } from './SignPlayer';
import { Mic, MicOff, Send, MessageSquare, Sparkles, Volume2, AlertCircle } from 'lucide-react';

interface HearingPanelProps {
  language: SignLanguage;
  isActive: boolean;
}

export const HearingPanel: React.FC<HearingPanelProps> = ({ language, isActive }) => {
  const [inputText, setInputText] = useState<string>('Hello thank you help');
  const [tokens, setTokens] = useState<TranslationToken[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Quick phrase suggestions tailored per language
  const quickPhrases = language === 'asl' ? [
    'Hello', 'Thank you', 'Yes', 'No', 'Help', 'Water', 'Please', 'Sorry', 'My name is', 'I love you'
  ] : [
    'Hello', 'Namaste', 'Thank you', 'Yes', 'No', 'Help', 'Water', 'Please', 'Sorry', 'Friend'
  ];

  const handleTranslate = async (overrideText?: string) => {
    const textToUse = overrideText !== undefined ? overrideText : inputText;
    if (!textToUse.trim()) return;

    setIsTranslating(true);
    setSpeechError(null);

    try {
      const resultTokens = await translationEngine.translateTextToSigns(textToUse, language);
      setTokens(resultTokens);
    } catch (err: any) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleMicListening = () => {
    setSpeechError(null);

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      const started = speechService.startListening({
        onResult: (transcript) => {
          setInputText(transcript);
          handleTranslate(transcript);
        },
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });

      if (started) {
        setIsListening(true);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-3xl transition-all duration-300 p-5 ${
      isActive
        ? 'glass-panel border-2 border-brand-500/50 shadow-2xl shadow-brand-500/10'
        : 'bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 opacity-90'
    }`}>
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Hearing Interface
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Speak or type to generate sign language</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Target: {language.toUpperCase()}
        </span>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <div className="relative flex items-center bg-white dark:bg-slate-950/90 rounded-2xl border border-slate-300 dark:border-slate-800 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all p-1.5 shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
            placeholder="Type speech message to sign..."
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />

          {/* Web Speech API Microphone Trigger */}
          <button
            onClick={toggleMicListening}
            className={`flex items-center justify-center p-3 rounded-xl transition-all mr-1.5 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isListening ? 'Listening... Click to stop' : 'Use Voice Dictation (Speech-to-Text)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Submit Translate Button */}
          <button
            onClick={() => handleTranslate()}
            disabled={isTranslating || !inputText.trim()}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-brand-600/30 transition-all active:scale-95"
          >
            <span>Sign</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{speechError}</span>
          </div>
        )}
      </div>

      {/* Quick Phrase Chips */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">
          Quick Suggestions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPhrases.map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                setInputText(phrase);
                handleTranslate(phrase);
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 shadow-sm"
            >
              + {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Sequence Video Player Output */}
      <div className="flex-1">
        <SignPlayer tokens={tokens} language={language} />
      </div>
    </div>
  );
};
