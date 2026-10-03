import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Circle, Square, RotateCcw, Sparkles, Check, X, ShieldAlert, Sliders, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DunkMove, HighlightVideo } from '../types';
import { sound } from '../utils/audio';

interface HighlightRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedDunks: DunkMove[];
  onPublishHighlight: (highlight: Partial<HighlightVideo>) => void;
  dunkerName: string;
}

export const HighlightRecorder: React.FC<HighlightRecorderProps> = ({
  isOpen,
  onClose,
  unlockedDunks,
  onPublishHighlight,
  dunkerName,
}) => {
  const [title, setTitle] = useState('');
  const [selectedDunk, setSelectedDunk] = useState(unlockedDunks[0]?.name || 'One-Hand Tomahawk');
  const [filter, setFilter] = useState<'none' | 'vhs' | 'neon' | 'fire' | 'retro'>('none');
  const [sticker, setSticker] = useState('CERTIFIED 50 🌟');
  const [score, setScore] = useState(50);
  
  // Camera & MediaRecorder
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSlowMo, setIsSlowMo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      resetRecording();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera initialization issue:', err);
      setCameraError('Camera access unavailable. You can still create an instant AI simulated highlight clip below!');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const resetRecording = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Start with 3-second countdown
  const initiateRecordingWithCountdown = () => {
    setCountdown(3);
    sound.playJudgeChime();

    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        sound.playJudgeChime();
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    sound.playBuzzer();
    setIsRecording(true);
    setRecordingSeconds(0);
    recordedChunksRef.current = [];

    if (mediaStreamRef.current && window.MediaRecorder) {
      try {
        const recorder = new MediaRecorder(mediaStreamRef.current);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedBlobUrl(url);
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.warn('MediaRecorder error:', e);
      }
    }

    timerIntervalRef.current = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  };

  const stopActualRecording = () => {
    sound.playBuzzer();
    sound.playCrowdCheer();
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback simulated recording blob
      setRecordedBlobUrl('simulated-clip');
    }
  };

  const handleSimulateInstantClip = () => {
    sound.playRimSlam();
    sound.playCrowdCheer();
    setRecordedBlobUrl('simulated-clip');
    if (!title) {
      setTitle(`${selectedDunk} - 50 Point Flight`);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `${selectedDunk} Showcase`;

    const newHighlight: Partial<HighlightVideo> = {
      title: finalTitle,
      dunkerName: dunkerName,
      dunkMoveName: selectedDunk,
      score: score,
      videoUrl: recordedBlobUrl && recordedBlobUrl !== 'simulated-clip' ? recordedBlobUrl : undefined,
      thumbnailGradient: filter === 'neon' ? 'from-cyan-600 via-purple-700 to-neutral-900' :
                         filter === 'fire' ? 'from-red-600 via-amber-700 to-neutral-900' :
                         'from-orange-600 via-amber-800 to-neutral-900',
      filter: filter,
      sticker: sticker,
      isUserSubmission: true,
      comments: [
        { user: 'DunkContestJudge', text: 'Stuck the landing with massive authority!', time: 'Just now' }
      ]
    };

    onPublishHighlight(newHighlight);
    sound.playCashRegister();
    sound.playCrowdCheer();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="highlight-recorder-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black font-display uppercase tracking-wide text-white">
                Dunk Highlight Studio
              </h3>
              <p className="text-xs text-neutral-400">
                Record with webcam or render an arena highlight clip to earn +50 Dunk Points!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* Video Preview Box */}
          <div className="relative w-full aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
            
            {/* Live Camera View */}
            {cameraActive && !recordedBlobUrl && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  filter === 'vhs' ? 'contrast-125 sepia-50 hue-rotate-15' :
                  filter === 'neon' ? 'hue-rotate-90 saturate-200' :
                  filter === 'fire' ? 'sepia-75 saturate-200' :
                  filter === 'retro' ? 'grayscale contrast-150' : ''
                }`}
              />
            )}

            {/* Recorded Blob Video View */}
            {recordedBlobUrl && recordedBlobUrl !== 'simulated-clip' && (
              <video
                src={recordedBlobUrl}
                controls
                autoPlay
                loop
                playbackRate={isSlowMo ? 0.5 : 1}
                className="w-full h-full object-cover"
              />
            )}

            {/* Simulated Clip View (if no camera or instant clip requested) */}
            {(!cameraActive && !recordedBlobUrl) || recordedBlobUrl === 'simulated-clip' ? (
              <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br ${
                filter === 'neon' ? 'from-purple-900 via-indigo-950 to-neutral-950' :
                filter === 'fire' ? 'from-orange-900 via-red-950 to-neutral-950' :
                'from-neutral-900 via-amber-950/40 to-neutral-950'
              }`}>
                <div className="text-5xl sm:text-6xl mb-3 animate-bounce">🏀💥</div>
                <div className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
                  {selectedDunk}
                </div>
                <div className="text-xs text-orange-400 font-semibold mt-1">
                  Ready for Slow-Mo Review • {score}/50 Judge Score
                </div>

                {!recordedBlobUrl && (
                  <button
                    type="button"
                    onClick={handleSimulateInstantClip}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black text-xs uppercase tracking-wider transition-transform hover:scale-105"
                  >
                    Generate Highlight Reel Now
                  </button>
                )}
              </div>
            ) : null}

            {/* Sticker Stamp Overlay on Top Right */}
            {sticker && (
              <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-amber-400/60 text-amber-300 font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl transform rotate-3">
                {sticker}
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <span className="font-display font-black text-7xl sm:text-9xl text-orange-500 animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse shadow-lg">
                <Circle className="w-3 h-3 fill-white" />
                <span>REC {recordingSeconds}s</span>
              </div>
            )}

            {/* Camera Controls Bar (Inside Preview) */}
            <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between bg-black/75 backdrop-blur-md p-3 rounded-2xl border border-neutral-700/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSlowMo(!isSlowMo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSlowMo ? 'bg-orange-500 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {isSlowMo ? '0.5x Slow-Mo ON' : '1.0x Normal'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                {!isRecording && !recordedBlobUrl && (
                  <button
                    type="button"
                    onClick={initiateRecordingWithCountdown}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-transform hover:scale-105 shadow-md shadow-red-600/30"
                  >
                    <Circle className="w-3.5 h-3.5 fill-white" />
                    <span>Record Video</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={stopActualRecording}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 font-black text-xs uppercase tracking-wider transition-transform hover:scale-105"
                  >
                    <Square className="w-3.5 h-3.5 fill-neutral-950" />
                    <span>Stop ({recordingSeconds}s)</span>
                  </button>
                )}

                {recordedBlobUrl && (
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Form Options: Filters, Stickers, Title */}
          <form onSubmit={handlePublish} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Highlight Title */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Highlight Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50-Point Eastbay Windmill Flight!"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Dunk Move Tag */}
              <div>
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                  Associated Dunk Move
                </label>
                <select
                  value={selectedDunk}
                  onChange={(e) => setSelectedDunk(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {unlockedDunks.map((dunk) => (
                    <option key={dunk.id} value={dunk.name}>
                      {dunk.name} ({dunk.difficulty})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Filters Row */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                Visual Filter
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'none', label: 'Clean' },
                  { id: 'vhs', label: '90s VHS' },
                  { id: 'neon', label: 'Neon' },
                  { id: 'fire', label: 'Fire' },
                  { id: 'retro', label: 'B&W' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      filter === f.id
                        ? 'bg-neutral-800 border-orange-500 text-white shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Stamp Row */}
            <div>
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
                Tape Sticker Badge
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'CERTIFIED 50 🌟',
                  'POSTERIZED 💥',
                  'HANGTIME GOD 🚀',
                  'AIR WALKER ⚡',
                  'RIM BREAKER 🔨',
                  'CUSTOM LAB KING 🧪',
                ].map((stk) => (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => setSticker(stk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      sticker === stk
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {stk}
                  </button>
                ))}
              </div>
            </div>

            {/* Publish & Earn CTA */}
            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Publishing rewards +50 Dunk Points to your wallet!</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 transition-all"
                >
                  Share & Earn +50 PTS
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
