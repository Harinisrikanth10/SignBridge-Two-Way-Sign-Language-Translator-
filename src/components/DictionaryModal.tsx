import React, { useState, useEffect } from 'react';
import { SignLanguage, LanguageDictionaryFile, LanguageFingerspellingFile } from '../types/sign';
import { translationEngine } from '../services/translationEngine';
import { X, Search, BookOpen, Hand, Sparkles, Filter } from 'lucide-react';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SignLanguage;
  onSelectLanguage: (lang: SignLanguage) => void;
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'words' | 'alphabet'>('words');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dictionaryData, setDictionaryData] = useState<LanguageDictionaryFile | null>(null);
  const [fingerspellingData, setFingerspellingData] = useState<LanguageFingerspellingFile | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      const data = await translationEngine.loadLanguageData(currentLanguage);
      setDictionaryData(data.dictionary);
      setFingerspellingData(data.fingerspelling);
    };
    fetchData();
  }, [isOpen, currentLanguage]);

  if (!isOpen) return null;

  const categories = ['All', ...new Set(Object.values(dictionaryData?.dictionary || {}).map(item => item.category))];

  const filteredWords = Object.entries(dictionaryData?.dictionary || {}).filter(([word, entry]) => {
    const matchesSearch = word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || entry.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const alphabetEntries = Object.entries(fingerspellingData?.alphabet || {}).filter(([letter, entry]) => {
    return letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
           entry.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl glass-panel border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              currentLanguage === 'asl'
                ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                : 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
            }`}>
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sign Library Explorer
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  currentLanguage === 'asl' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {currentLanguage.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse supported sign language vocabulary & manual alphabet handshapes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Language Switcher, Tabs, & Search */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
          {/* Language Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectLanguage('asl')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentLanguage === 'asl'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              🇺🇸 ASL Library
            </button>
            <button
              onClick={() => onSelectLanguage('isl')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentLanguage === 'isl'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              🇮🇳 ISL Library
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('words')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'words' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Word Signs ({filteredWords.length})
            </button>
            <button
              onClick={() => setActiveTab('alphabet')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'alphabet' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Alphabet (A-Z)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign dictionary..."
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
          {activeTab === 'words' ? (
            <div>
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1 flex-shrink-0" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Word Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWords.map(([word, entry]) => (
                  <div
                    key={word}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:scale-[1.01] shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {entry.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                          {currentLanguage}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 capitalize">
                        {entry.label}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {entry.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      <span>Clip: {entry.filename}</span>
                      <Hand className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Fingerspelling Alphabet Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {alphabetEntries.map(([letter, entry]) => (
                <div
                  key={letter}
                  className={`flex flex-col items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center transition-all hover:scale-105 shadow-sm ${
                    currentLanguage === 'asl' ? 'hover:border-indigo-400 dark:hover:border-indigo-500/50' : 'hover:border-emerald-400 dark:hover:border-emerald-500/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 font-black text-2xl ${
                    currentLanguage === 'asl'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-200'
                  }`}>
                    {letter}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {entry.hands === 2 ? 'Two-Handed' : 'One-Handed'}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
