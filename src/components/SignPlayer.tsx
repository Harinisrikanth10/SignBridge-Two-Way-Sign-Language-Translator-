import React, { useState, useEffect, useRef } from 'react';
import { TranslationToken, SignLanguage } from '../types/sign';
import { LandmarkTemplatesService } from '../services/landmarkTemplates';
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Gauge, Sparkles, Hand, Activity } from 'lucide-react';

interface SignPlayerProps {
  tokens: TranslationToken[];
  language: SignLanguage;
  onFinished?: () => void;
}

export const SignPlayer: React.FC<SignPlayerProps> = ({ tokens, language, onFinished }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);
  const [showLandmarkCanvas, setShowLandmarkCanvas] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Reset state when tokens or language changes
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPlaying(tokens.length > 0);
  }, [tokens, language]);

  // Main playback loop
  useEffect(() => {
    if (!isPlaying || tokens.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentToken = tokens[currentIndex];
    const baseDuration = currentToken?.type === 'word' ? 1500 : 1000;
    const duration = baseDuration / playbackSpeed;

    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    timerRef.current = setTimeout(() => {
      if (currentIndex < tokens.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setProgress(100);
        if (onFinished) onFinished();
      }
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentIndex, isPlaying, tokens, playbackSpeed, onFinished]);

  // Draw 21-point Landmark skeleton canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tokens.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 300;
    const height = canvas.height || 200;
    ctx.clearRect(0, 0, width, height);

    const activeToken = tokens[currentIndex];
    if (!activeToken) return;

    const tmpl = LandmarkTemplatesService.getTemplate(activeToken.token);
    if (!tmpl) return;

    const primaryColor = language === 'asl' ? '#6366f1' : '#10b981';
    const secondaryColor = '#f59e0b';

    const drawHand = (landmarks: any[], isHand2: boolean = false) => {
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17]
      ];

      const color = isHand2 ? secondaryColor : primaryColor;
      const centerX = width / 2;
      const centerY = height / 2 + 10;
      const scale = width * 0.35;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      connections.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(centerX + p1.x * scale, centerY + p1.y * scale);
        ctx.lineTo(centerX + p2.x * scale, centerY + p2.y * scale);
        ctx.stroke();
      });

      landmarks.forEach((pt, idx) => {
        const x = centerX + pt.x * scale;
        const y = centerY + pt.y * scale;
        const isTip = [4, 8, 12, 16, 20].includes(idx);

        ctx.beginPath();
        ctx.arc(x, y, isTip ? 5 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? '#ffffff' : color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isTip ? 8 : 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    if (tmpl.hand1Landmarks) drawHand(tmpl.hand1Landmarks, false);
    if (tmpl.hand2Landmarks) drawHand(tmpl.hand2Landmarks, true);

  }, [currentIndex, tokens, language, showLandmarkCanvas]);

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 min-h-[320px] text-center transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800/80 flex items-center justify-center mb-4 text-slate-500 border border-slate-300 dark:border-slate-700/50">
          <Hand className="w-8 h-8 opacity-60 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300 mb-1">
          Ready to Translate
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Type a message or press the microphone to translate speech into{' '}
          <span className="font-semibold text-brand-600 dark:text-brand-400">{language.toUpperCase()}</span> sign language video sequence.
        </p>
      </div>
    );
  }

  const activeToken = tokens[currentIndex] || tokens[0];

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
      {/* Video / Visual Playback Area */}
      <div className="relative w-full aspect-video bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6 border-b border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {/* Language Badge & Toggle Landmark View */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-md ${
            language === 'asl' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {language.toUpperCase()} Sign Clip
          </span>

          <button
            onClick={() => setShowLandmarkCanvas(!showLandmarkCanvas)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showLandmarkCanvas
                ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-500/60 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle 21 3D Hand Landmark Vector Skeleton overlay"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>21-Keypoint Skeleton</span>
          </button>
        </div>

        {/* Playhead Progress Overlay Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full transition-all ease-linear ${
              language === 'asl' ? 'bg-indigo-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Visual Animated Sign Canvas Card */}
        <div className="relative flex flex-col items-center justify-center my-auto transition-all duration-300 scale-100 hover:scale-[1.02]">
          {showLandmarkCanvas ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 shadow-2xl mb-3 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={150}
                  height={150}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1 capitalize">
                {activeToken.label}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md px-4 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/40 shadow-sm">
                {activeToken.description}
              </p>
            </div>
          ) : activeToken.type === 'word' ? (
            <div className="flex flex-col items-center text-center">
              {/* Dynamic Animated Hand Icon Graphic */}
              <div className="relative flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xl mb-4 group">
                <div className={`absolute inset-0 rounded-3xl opacity-20 blur-xl animate-pulse ${
                  language === 'asl' ? 'bg-indigo-500' : 'bg-emerald-500'
                }`} />
                <Hand className={`w-14 h-14 transition-transform duration-500 transform group-hover:rotate-12 ${
                  language === 'asl' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
                }`} />
                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1 capitalize">
                {activeToken.label}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md px-4 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/40 shadow-sm">
                {activeToken.description}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              {/* Manual Alphabet Letter Card */}
              <div className={`relative flex items-center justify-center w-28 h-28 rounded-3xl border-2 shadow-2xl mb-4 ${
                language === 'asl'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500/60 shadow-indigo-500/10'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 shadow-emerald-500/10'
              }`}>
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-widest drop-shadow-md">
                  {activeToken.token}
                </span>
                <span className="absolute bottom-1 right-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {language.toUpperCase()} {activeToken.handsCount === 2 ? '2-HAND' : '1-HAND'}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Fingerspelled Letter "{activeToken.token}"
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm px-3 py-1 rounded-md bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                {activeToken.description}
              </p>
            </div>
          )}
        </div>

        {/* Counter Overlay */}
        <div className="absolute bottom-3 right-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          {currentIndex + 1} / {tokens.length}
        </div>
      </div>

      {/* Playback Controls & Speed selector */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsPlaying(true);
            }}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
            title="Previous sign"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              language === 'asl'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={() => setCurrentIndex(prev => Math.min(tokens.length - 1, prev + 1))}
            disabled={currentIndex === tokens.length - 1}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
            title="Next sign"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            {[0.5, 1.0, 1.5].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-all ${
                  playbackSpeed === speed
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sequence Filmstrip / Token List */}
      <div className="p-3 bg-slate-100 dark:bg-slate-950 overflow-x-auto transition-colors">
        <div className="flex items-center gap-2 min-w-max">
          {tokens.map((tok, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={tok.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  isActive
                    ? language === 'asl'
                      ? 'bg-indigo-600 text-white font-bold scale-105 shadow-md shadow-indigo-500/20'
                      : 'bg-emerald-600 text-white font-bold scale-105 shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
                }`}
              >
                <span className="font-semibold">{tok.token}</span>
                {tok.type === 'letter' && (
                  <span className="text-[10px] opacity-75 uppercase">({tok.token})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
