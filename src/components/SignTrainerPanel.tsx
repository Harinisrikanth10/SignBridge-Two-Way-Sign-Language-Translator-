import React, { useRef, useEffect, useState } from 'react';
import { SignLanguage, RecognizedGesture } from '../types/sign';
import { LandmarkClassifier } from '../services/landmarkClassifier';
import { LandmarkTemplatesService } from '../services/landmarkTemplates';
import { Camera, CameraOff, Award, CheckCircle2, RotateCcw, ArrowRight, Sparkles, Flame, Volume2, ShieldCheck } from 'lucide-react';

interface SignTrainerPanelProps {
  language: SignLanguage;
}

interface PracticeChallenge {
  id: string;
  targetName: string;
  label: string;
  hint: string;
  handsCount: 1 | 2;
}

const ASL_CHALLENGES: PracticeChallenge[] = [
  { id: 'c1', targetName: 'HELLO', label: 'Hello (Open Hand)', hint: 'Extend all 5 fingers straight up and spread apart.', handsCount: 1 },
  { id: 'c2', targetName: 'L', label: 'Letter L', hint: 'Extend Index finger UP and Thumb OUT perpendicular.', handsCount: 1 },
  { id: 'c3', targetName: 'V', label: 'Letter V (Peace)', hint: 'Extend Index and Middle fingers in a V shape.', handsCount: 1 },
  { id: 'c4', targetName: 'I LOVE YOU', label: 'I Love You (ILY)', hint: 'Extend Thumb, Index, and Pinky fingers; fold Middle & Ring fingers.', handsCount: 1 },
  { id: 'c5', targetName: 'YES', label: 'Yes (Thumbs Up)', hint: 'Make a fist with Thumb pointing straight UP.', handsCount: 1 },
  { id: 'c6', targetName: 'Y', label: 'Letter Y', hint: 'Extend Thumb and Pinky outward only; fold Index, Middle, Ring.', handsCount: 1 },
  { id: 'c7', targetName: 'W', label: 'Letter W', hint: 'Extend Index, Middle, and Ring fingers straight UP.', handsCount: 1 },
];

const ISL_CHALLENGES: PracticeChallenge[] = [
  { id: 'ic1', targetName: 'NAMASTE', label: 'Namaste / Hello', hint: 'Bring both hands up with all fingers extended upward close together.', handsCount: 2 },
  { id: 'ic2', targetName: 'HELLO', label: 'Hello (Single Hand)', hint: 'Extend all 5 fingers open facing camera.', handsCount: 1 },
  { id: 'ic3', targetName: 'PEACE', label: 'Peace / V Sign', hint: 'Extend Index and Middle fingers upward in V shape.', handsCount: 1 },
  { id: 'ic4', targetName: 'YES', label: 'Yes (Fist)', hint: 'Form a fist with thumb extended.', handsCount: 1 },
];

export const SignTrainerPanel: React.FC<SignTrainerPanelProps> = ({ language }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const challenges = language === 'asl' ? ASL_CHALLENGES : ISL_CHALLENGES;
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentGesture, setCurrentGesture] = useState<RecognizedGesture | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeChallenge = challenges[challengeIdx] || challenges[0];

  // Draw reference landmark skeleton for current target challenge
  useEffect(() => {
    const canvas = targetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tmpl = LandmarkTemplatesService.getTemplate(activeChallenge.targetName);
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
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 10;
      const scale = canvas.width * 0.38;

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
  }, [activeChallenge, language]);

  // Start / Stop Camera Stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err) {
      console.error('Camera access error in Trainer:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // MediaPipe hands processing loop
  useEffect(() => {
    let animFrameId: number;
    let handsInstance: any = null;

    const initializeMediaPipe = async () => {
      try {
        const handsModule = await import('@mediapipe/hands');
        const HandsClass = handsModule.Hands || (window as any).Hands;
        if (HandsClass) {
          handsInstance = new HandsClass({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });
          handsInstance.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.65,
            minTrackingConfidence: 0.65
          });
          handsInstance.onResults(onMediaPipeResults);
        }
      } catch (err) {
        console.warn('Trainer MediaPipe init fallback:', err);
      }
    };

    if (isCameraActive) initializeMediaPipe();

    const processFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && isCameraActive && handsInstance) {
        try {
          await handsInstance.send({ image: videoRef.current });
        } catch (_) {}
      }
      if (isCameraActive) animFrameId = requestAnimationFrame(processFrame);
    };

    if (isCameraActive) animFrameId = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (handsInstance) handsInstance.close();
    };
  }, [isCameraActive, activeChallenge, language]);

  // Results callback
  const onMediaPipeResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw skeleton
      results.multiHandLandmarks.forEach((landmarks: any[], idx: number) => {
        const strokeColor = idx === 0 ? (language === 'asl' ? '#6366f1' : '#10b981') : '#f59e0b';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
        ];
        connections.forEach(([i, j]) => {
          ctx.beginPath();
          ctx.moveTo(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height);
          ctx.lineTo(landmarks[j].x * canvas.width, landmarks[j].y * canvas.height);
          ctx.stroke();
        });
      });

      const gesture = LandmarkClassifier.classifyGesture(results.multiHandLandmarks, language);
      setCurrentGesture(gesture);

      if (gesture) {
        if (gesture.name.toUpperCase() === activeChallenge.targetName.toUpperCase()) {
          const score = Math.round(gesture.confidence * 100);
          setMatchScore(score);

          if (score >= 80 && !isSuccess) {
            handleSuccess();
          }
        } else {
          setMatchScore(35);
        }
      } else {
        setMatchScore(15);
      }
    } else {
      setCurrentGesture(null);
      setMatchScore(0);
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    setStreak(prev => prev + 1);
    setSuccessMessage(`Perfect! You matched "${activeChallenge.label}"! 🎉`);

    setTimeout(() => {
      setIsSuccess(false);
      setSuccessMessage(null);
      setMatchScore(0);
      setChallengeIdx(prev => (prev + 1) % challenges.length);
    }, 1800);
  };

  const nextChallenge = () => {
    setIsSuccess(false);
    setSuccessMessage(null);
    setMatchScore(0);
    setChallengeIdx(prev => (prev + 1) % challenges.length);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6 flex flex-col gap-6">
      {/* Practice Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-indigo-200 dark:border-indigo-500/30 shadow-2xl transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Sign Language Practice & Quiz
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300">
                {language.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Form the target hand shape in front of your webcam to test real-time gesture recognition accuracy.
            </p>
          </div>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 shadow-inner">
          <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Streak</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{streak} Perfect Signs</span>
          </div>
        </div>
      </div>

      {/* Main Practice Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Challenge Card (4 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
              Challenge {challengeIdx + 1} of {challenges.length}
            </span>

            <button
              onClick={nextChallenge}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <span>Skip Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Target Gesture
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              {activeChallenge.label}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 max-w-xs">
              {activeChallenge.hint}
            </p>

            {/* Target 21-point Reference Canvas */}
            <div className="relative w-40 h-40 rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 flex items-center justify-center shadow-lg overflow-hidden">
              <canvas
                ref={targetCanvasRef}
                width={160}
                height={160}
                className="w-full h-full object-contain pointer-events-none"
              />
              <span className="absolute bottom-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Reference Skeleton
              </span>
            </div>
          </div>

          {/* Accuracy Match Meter */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Handshape Similarity:</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{matchScore}%</span>
            </div>

            <div className="w-full h-3 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  matchScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/50' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
                }`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Reach 80%+ accuracy to score a perfect match!
            </p>
          </div>
        </div>

        {/* Right Column: Live Camera & Hand Classifier Feed (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl min-h-[420px] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Camera Feed</h3>
            </div>

            <button
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                isCameraActive ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isCameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          {/* Camera Viewport */}
          <div className="relative w-full aspect-video rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl flex items-center justify-center">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
            />

            {!isCameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                <Camera className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-white dark:text-slate-300 mb-1">Webcam Off</h4>
                <p className="text-xs text-slate-300 dark:text-slate-400 max-w-xs mb-3">
                  Click 'Start Camera' to initiate gesture matching for the practice challenge.
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Success Celebration Overlay */}
            {isSuccess && (
              <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mb-3 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Excellent Job! 🎉</h3>
                <p className="text-sm font-semibold text-emerald-400 max-w-xs mb-4">
                  {successMessage}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Live Detection Info */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Detected: {currentGesture ? currentGesture.label : 'Waiting for gesture in frame...'}
              </span>
            </div>

            <button
              onClick={nextChallenge}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              Next Sign →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
