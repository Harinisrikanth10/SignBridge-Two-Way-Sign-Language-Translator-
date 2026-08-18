import React, { useRef, useEffect, useState } from 'react';
import { SignLanguage, RecognizedGesture } from '../types/sign';
import { LandmarkClassifier } from '../services/landmarkClassifier';
import { speechService } from '../services/speechService';
import { Camera, CameraOff, Volume2, Trash2, Space, Delete, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DeafPanelProps {
  language: SignLanguage;
  isActive: boolean;
}

export const DeafPanel: React.FC<DeafPanelProps> = ({ language, isActive }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<RecognizedGesture | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [detectedHandsCount, setDetectedHandsCount] = useState<number>(0);

  // Debouncing & repetition guard ref
  const lastDetectionTimeRef = useRef<number>(0);
  const lastGestureNameRef = useRef<string>('');

  // Start / Stop camera stream
  const startCamera = async () => {
    setCameraError(null);
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
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Webcam permission denied or camera unavailable');
      setIsCameraActive(false);
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

  // MediaPipe Hands initialization & animation frame processing loop
  useEffect(() => {
    let animFrameId: number;
    let handsInstance: any = null;

    const initializeMediaPipe = async () => {
      try {
        // Dynamically import MediaPipe Hands
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
        console.warn('MediaPipe CDN module loading fallback active:', err);
      }
    };

    if (isCameraActive) {
      initializeMediaPipe();
    }

    // Canvas frame processing loop
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && isCameraActive) {
        if (handsInstance) {
          try {
            await handsInstance.send({ image: videoRef.current });
          } catch (_) {}
        } else {
          // Simulated fallback landmark tracking for offline/testing mode
          simulateHandDetection();
        }
      }
      if (isCameraActive) {
        animFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isCameraActive) {
      animFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (handsInstance) handsInstance.close();
    };
  }, [isCameraActive, language]);

  // MediaPipe Results Handler
  const onMediaPipeResults = (results: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setDetectedHandsCount(results.multiHandLandmarks.length);

      // Draw hand landmarks and skeleton connections
      results.multiHandLandmarks.forEach((landmarks: any[], handIdx: number) => {
        drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, handIdx);
      });

      // Classify gesture using our Language-Aware LandmarkClassifier
      const gesture = LandmarkClassifier.classifyGesture(results.multiHandLandmarks, language);
      handleDetectedGesture(gesture);
    } else {
      setDetectedHandsCount(0);
      setCurrentGesture(null);
    }
  };

  // Fallback landmark canvas overlay
  const simulateHandDetection = () => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render guide overlay
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Place hand in frame for landmark extraction', canvas.width / 3, canvas.height / 2);
  };

  // Draw 21 hand keypoints & skeleton lines on canvas
  const drawHandSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    handIdx: number
  ) => {
    // Keypoint connection pairs for hand skeleton
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],           // Index
      [5, 9], [9, 10], [10, 11], [11, 12],      // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],    // Ring
      [13, 17], [17, 18], [18, 19], [19, 20],   // Pinky
      [0, 17]                                  // Palm base
    ];

    const strokeColor = handIdx === 0
      ? (language === 'asl' ? '#6366f1' : '#10b981')
      : '#f59e0b';

    // Draw Skeleton Lines
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    });

    // Draw Glowing Landmark Joint Dots
    landmarks.forEach((pt, idx) => {
      const x = pt.x * width;
      const y = pt.y * height;
      const isTip = [4, 8, 12, 16, 20].includes(idx);

      ctx.beginPath();
      ctx.arc(x, y, isTip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#ffffff' : strokeColor;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = isTip ? 10 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  // Debouncing logic for gesture recognition to avoid repeating characters
  const handleDetectedGesture = (gesture: RecognizedGesture | null) => {
    if (!gesture) {
      setCurrentGesture(null);
      return;
    }

    setCurrentGesture(gesture);

    const now = Date.now();
    // Debounce time: 1200ms pause required between consecutive recognitions of same gesture
    if (
      now - lastDetectionTimeRef.current > 1200 ||
      gesture.name !== lastGestureNameRef.current
    ) {
      lastDetectionTimeRef.current = now;
      lastGestureNameRef.current = gesture.name;

      // Append recognized letter/word to sentence stream
      const addition = gesture.isFingerspelling ? gesture.name : ` ${gesture.name} `;
      setRecognizedText(prev => prev + addition);
    }
  };

  // Speak aloud recognized sentence using Web Speech API Synthesis
  const handleSpeakText = () => {
    if (!recognizedText.trim()) return;
    setIsSpeaking(true);
    speechService.speak(recognizedText, () => setIsSpeaking(false));
  };

  return (
    <div className={`flex flex-col h-full rounded-3xl transition-all duration-300 p-5 ${
      isActive
        ? 'glass-panel border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/10'
        : 'bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 opacity-90'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Deaf Interface
              {isCameraActive && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping" />
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">MediaPipe Hands Live Landmark Classifier</p>
          </div>
        </div>

        {/* Camera Start/Stop Button */}
        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 ${
            isCameraActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isCameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
          <span>{isCameraActive ? 'Stop Camera' : 'Start Camera'}</span>
        </button>
      </div>

      {/* Camera Viewport & Canvas Overlay */}
      <div className="relative w-full aspect-video rounded-2xl bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden mb-4 shadow-xl flex items-center justify-center">
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
            <div className="w-14 h-14 rounded-2xl bg-white/10 dark:bg-slate-900/90 border border-white/20 dark:border-slate-800 flex items-center justify-center mb-3 text-slate-300 dark:text-slate-500">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-white dark:text-slate-300 mb-1">Webcam Inactive</h3>
            <p className="text-xs text-slate-300 dark:text-slate-400 max-w-xs mb-4">
              Click 'Start Camera' to initiate MediaPipe real-time hand tracking & sign detection.
            </p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Enable Live Camera
            </button>
          </div>
        )}

        {/* Live Detected Gesture Floating HUD */}
        {isCameraActive && currentGesture && (
          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between p-3 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-indigo-300 dark:border-indigo-500/40 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Recognized {currentGesture.isFingerspelling ? 'Letter' : 'Word'} ({currentGesture.language.toUpperCase()})
                </span>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {currentGesture.label}
                </h4>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-300">
                {Math.round(currentGesture.confidence * 100)}% Confidence
              </span>
              <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${currentGesture.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hands Count Badge */}
        {isCameraActive && (
          <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-[11px] font-mono text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 shadow-sm">
            Hands Tracked: {detectedHandsCount} {language === 'isl' ? '(ISL 2-Hand Enabled)' : '(ASL)'}
          </div>
        )}
      </div>

      {/* Camera Error Message */}
      {cameraError && (
        <div className="mb-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Recognized Sentence Buffer Box */}
      <div className="flex-1 flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 shadow-inner">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recognized Speech Buffer:
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              {recognizedText.length} chars
            </span>
          </div>

          <div className="min-h-[70px] p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-base font-medium text-slate-900 dark:text-white tracking-wide break-words">
            {recognizedText || (
              <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                Recognized letters and word signs will assemble here in real-time...
              </span>
            )}
          </div>
        </div>

        {/* Sentence Editing Controls & Text-To-Speech */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRecognizedText(prev => prev + ' ')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Add space between words"
            >
              <Space className="w-3.5 h-3.5" />
              <span>Space</span>
            </button>

            <button
              onClick={() => setRecognizedText(prev => prev.slice(0, -1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Delete last letter"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>Backspace</span>
            </button>

            <button
              onClick={() => setRecognizedText('')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
              title="Clear entire text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Web Speech API Text-to-Speech Trigger */}
          <button
            onClick={handleSpeakText}
            disabled={!recognizedText.trim() || isSpeaking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
            <span>{isSpeaking ? 'Speaking...' : 'Speak Aloud'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
