import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Film, 
  Camera, 
  Sparkles, 
  X, 
  Zap, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Flame,
  Gauge
} from 'lucide-react';
import { DunkMove, AvatarConfig } from '../types';
import { JerseyAvatar } from './JerseyAvatar';
import { sound } from '../utils/audio';

interface SloMoReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dunk: DunkMove;
  avatar: AvatarConfig;
  playerName: string;
  timingAccuracy?: 'PERFECT' | 'GREAT' | 'GOOD' | 'CLANK';
  score?: number;
}

type CameraAngle = 'broadcast' | 'rim_zoom' | 'low_floor';

export const SloMoReplayModal: React.FC<SloMoReplayModalProps> = ({
  isOpen,
  onClose,
  dunk,
  avatar,
  playerName,
  timingAccuracy = 'PERFECT',
  score = 50,
}) => {
  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [speed, setSpeed] = useState<0.1 | 0.25 | 0.5 | 1.0>(0.25);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('broadcast');
  const [showGhostTrails, setShowGhostTrails] = useState(true);
  const [soundMuted, setSoundMuted] = useState(false);

  // Ghost history buffer for motion trails
  const [ghosts, setGhosts] = useState<{ x: number; y: number; rot: number; id: number }[]>([]);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const ghostCounterRef = useRef(0);

  // Reset progress when modal opens or dunk changes
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsPlaying(true);
      setGhosts([]);
      sound.playSlowMoWhoosh();
    }
  }, [isOpen, dunk.id]);

  // Main playback animation loop
  useEffect(() => {
    if (!isOpen || !isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (time - lastTimeRef.current) / 1000;
        
        // Base cycle is ~3.5 seconds at 1.0x speed
        // At 0.25x speed it takes ~14 seconds
        const rate = (100 / 3.5) * speed; 
        
        setProgress((prev) => {
          let next = prev + rate * delta;
          if (next >= 100) {
            next = 100;
            setIsPlaying(false);
          }
          return next;
        });
      }

      lastTimeRef.current = time;
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen, isPlaying, speed]);

  // Calculate coordinates based on progress (0% - 100%)
  // 0% -> 25%: Runway Approach
  // 25% -> 48%: Takeoff & Skyward Lift
  // 48% -> 76%: Apex Hangtime & Signature Trick
  // 76% -> 86%: Rim Impact Slam
  // 86% -> 100%: Hang & Land
  const computePositions = (p: number) => {
    let playerX = 14;
    let playerY = 72;
    let ballX = 20;
    let ballY = 66;
    let ballRot = 0;
    let actionState: 'sprint' | 'lift' | 'apex' | 'slam' | 'land' = 'sprint';

    if (p < 25) {
      // Runway
      const t = p / 25;
      playerX = 14 + t * 24; // 14 -> 38
      playerY = 72;
      ballX = playerX + 6;
      ballY = 66 + Math.sin(t * Math.PI * 4) * 4;
      ballRot = t * 360;
      actionState = 'sprint';
    } else if (p < 48) {
      // Takeoff Lift
      const t = (p - 25) / 23;
      playerX = 38 + t * 20; // 38 -> 58
      playerY = 72 - Math.sin(t * Math.PI * 0.5) * 44; // 72 -> 28
      ballX = playerX + 4;
      ballY = playerY - 4;
      ballRot = 360 + t * 360;
      actionState = 'lift';
    } else if (p < 76) {
      // Apex Hangtime & Signature Trick
      const t = (p - 48) / 28;
      playerX = 58 + t * 19; // 58 -> 77
      // Float at apex with gentle arc
      playerY = 28 - Math.sin(t * Math.PI) * 6; // floats between 22 and 28
      ballX = playerX + Math.cos(t * Math.PI * 2) * 5;
      ballY = playerY - 4 + Math.sin(t * Math.PI * 2) * 4;
      ballRot = 720 + t * (dunk.difficulty === 'Legendary' ? 1080 : 720);
      actionState = 'apex';
    } else if (p < 86) {
      // Rim Impact & Flush
      const t = (p - 76) / 10;
      playerX = 77 + t * 3; // 77 -> 80
      playerY = 28 + t * 10; // 28 -> 38
      ballX = 81;
      ballY = 38 + t * 12; // ball forced into net
      ballRot = 1440;
      actionState = 'slam';
    } else {
      // Landing & recovery
      const t = (p - 86) / 14;
      playerX = 80 + t * 2;
      playerY = 38 + t * 32; // 38 -> 70
      ballX = 84 + t * 4;
      ballY = 50 + t * 22;
      ballRot = 1500;
      actionState = 'land';
    }

    return { playerX, playerY, ballX, ballY, ballRot, actionState };
  };

  const { playerX, playerY, ballX, ballY, ballRot, actionState } = computePositions(progress);

  // Update ghost trail positions
  useEffect(() => {
    if (!showGhostTrails || !isPlaying) return;
    ghostCounterRef.current += 1;
    if (ghostCounterRef.current % 3 === 0) {
      setGhosts((prev) => [
        ...prev.slice(-6),
        { x: playerX, y: playerY, rot: ballRot, id: Date.now() + Math.random() },
      ]);
    }
  }, [playerX, playerY, ballRot, showGhostTrails, isPlaying]);

  // Audio cues at key milestones
  const prevProgressRef = useRef(0);
  useEffect(() => {
    if (soundMuted) return;
    if (prevProgressRef.current < 48 && progress >= 48) {
      sound.playSlowMoWhoosh();
    }
    if (prevProgressRef.current < 78 && progress >= 78) {
      sound.playSlowMoSlam();
    }
    prevProgressRef.current = progress;
  }, [progress, soundMuted]);

  if (!isOpen) return null;

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
    setGhosts([]);
    sound.playSlowMoWhoosh();
  };

  const handleTogglePlay = () => {
    if (progress >= 100) {
      handleRestart();
    } else {
      setIsPlaying(!isPlaying);
      sound.playBounce();
    }
  };

  // Camera zoom container transforms
  const getCameraTransform = () => {
    switch (cameraAngle) {
      case 'rim_zoom':
        return 'scale(1.4) translate(-18%, 10%)';
      case 'low_floor':
        return 'scale(1.2) translate(-5%, -8%) rotate(-1deg)';
      case 'broadcast':
      default:
        return 'scale(1) translate(0%, 0%)';
    }
  };

  return (
    <div 
      id="slo-mo-replay-modal"
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-fadeIn">
        
        {/* Top Control Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  SLOW-MO REPLAY LAB
                </span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  {speed}X SPEED
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white uppercase tracking-wide">
                {dunk.name} • {playerName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Stage with Cinematic Letterboxing */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-neutral-950 overflow-hidden select-none border-y-4 border-neutral-950">
          
          {/* Subtle slow-mo broadcast HUD Watermark */}
          <div className="absolute top-3 left-4 z-30 flex items-center gap-3 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700/60 text-[10px] font-black text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>REC // 240 FPS ULTRA-SLO-MO</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700/60 text-[10px] font-mono font-bold text-amber-400">
              FRAME: {Math.round(progress * 2.4).toString().padStart(3, '0')} / 240
            </div>
          </div>

          {/* Telemetry HUD (Right) */}
          <div className="absolute top-3 right-4 z-30 hidden sm:flex flex-col items-end gap-1.5 pointer-events-none text-right">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-bold text-neutral-200">
              <span className="text-neutral-400 mr-2">APEX VERTICAL:</span>
              <span className="text-amber-400 font-mono font-black">48.6 INCHES</span>
            </div>
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-bold text-neutral-200">
              <span className="text-neutral-400 mr-2">AIR HANGTIME:</span>
              <span className="text-orange-400 font-mono font-black">{(dunk.hangtimeRequired * (1 / speed)).toFixed(2)}s ({speed}x)</span>
            </div>
          </div>

          {/* Interactive Stage Canvas Container with Camera Zoom */}
          <div 
            className="w-full h-full relative transition-transform duration-500 ease-out origin-center"
            style={{ transform: getCameraTransform() }}
          >
            {/* Arena Backdrop Lights & Floor */}
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-amber-950/40 pointer-events-none" />
            
            {/* Spotlight Beam Tracking the Dunker */}
            <div 
              className="absolute -top-10 w-80 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none transition-all duration-300"
              style={{ left: `${playerX - 20}%` }}
            />

            {/* Hardwood Court Floor with Reflections */}
            <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-t from-amber-950/80 to-amber-900/30 border-t-2 border-amber-600/40">
              <div className="w-full h-full opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute bottom-0 left-1/3 w-px h-full bg-amber-500/40" />
              <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-32 h-32 rounded-full border-2 border-amber-500/30 border-b-transparent" />
            </div>

            {/* Basketball Rim & Backboard (Right side) */}
            <div className={`absolute top-12 sm:top-16 right-8 sm:right-16 z-10 ${
              actionState === 'slam' ? 'animate-rim-rattle' : ''
            }`}>
              <div className="absolute -top-6 -right-4 w-4 h-56 bg-neutral-700 border-r border-neutral-600" />
              <div className="w-24 sm:w-32 h-20 sm:h-24 bg-white/15 backdrop-blur-md border-2 border-white/70 rounded-sm shadow-2xl relative flex items-center justify-center">
                <div className="w-10 sm:w-14 h-8 sm:h-10 border-2 border-orange-500" />
                <div className="absolute -bottom-1 -left-12 sm:-left-16 w-12 sm:w-16 h-3 bg-orange-500 rounded-sm shadow-md flex items-center justify-center">
                  <div className={`absolute top-2 w-10 sm:w-12 h-12 border-x-2 border-b-2 border-white/80 border-dashed rounded-b-xl opacity-90 transition-transform ${
                    actionState === 'slam' ? 'scale-110 rotate-2' : ''
                  }`} />
                </div>
              </div>
            </div>

            {/* Motion Blur Ghost Trails in Slow-Mo */}
            {showGhostTrails && ghosts.map((ghost, idx) => (
              <div
                key={ghost.id}
                className="absolute z-10 pointer-events-none transition-opacity duration-300"
                style={{
                  left: `${ghost.x}%`,
                  top: `${ghost.y}%`,
                  opacity: (idx + 1) * 0.08,
                }}
              >
                <div className="w-16 h-20 flex flex-col items-center justify-center relative -translate-x-1/2 -translate-y-1/2">
                  <div 
                    className="absolute inset-0 rounded-full blur-md opacity-30"
                    style={{ backgroundColor: dunk.auraColor || avatar.primaryColor }}
                  />
                  <span className="text-4xl sm:text-5xl filter blur-[1px] opacity-40">
                    ⛹️‍♂️
                  </span>
                </div>
              </div>
            ))}

            {/* Player Avatar */}
            <div 
              className="absolute z-20 pointer-events-none transition-transform duration-75"
              style={{ left: `${playerX}%`, top: `${playerY}%` }}
            >
              <div className="w-16 h-20 flex flex-col items-center justify-center relative -translate-x-1/2 -translate-y-1/2">
                {/* Aura Glow */}
                <div 
                  className="absolute inset-0 rounded-full blur-lg opacity-60 animate-pulse"
                  style={{ backgroundColor: dunk.auraColor || avatar.primaryColor }}
                />

                {/* Animated Emoji / Character Pose */}
                <span className={`text-4xl sm:text-5xl filter drop-shadow-2xl transform transition-transform ${
                  actionState === 'apex' ? 'scale-125 -rotate-12' : actionState === 'slam' ? 'scale-130 rotate-6' : ''
                }`}>
                  {actionState === 'sprint' ? '🏃‍♂️' : actionState === 'lift' ? '🧗‍♂️' : actionState === 'apex' ? '🦅' : actionState === 'slam' ? '💥' : '⛹️‍♂️'}
                </span>

                {/* Floating Jersey Badge */}
                <span 
                  className="mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black leading-tight border shadow-md"
                  style={{
                    backgroundColor: avatar.primaryColor || '#ef4444',
                    borderColor: avatar.secondaryColor || '#000000',
                    color: avatar.numberColor || '#ffffff',
                  }}
                >
                  #{avatar.jerseyNumber ?? 23}
                </span>

                {/* Slow-mo flight halo */}
                {actionState === 'apex' && (
                  <div className="absolute -inset-4 border border-amber-400/40 rounded-full animate-ping pointer-events-none" />
                )}
              </div>
            </div>

            {/* Basketball */}
            <div 
              className="absolute z-20 pointer-events-none transition-transform duration-75"
              style={{
                left: `${ballX}%`,
                top: `${ballY}%`,
                transform: `rotate(${ballRot}deg)`,
              }}
            >
              <span className="text-2xl sm:text-3xl filter drop-shadow-md select-none inline-block">
                🏀
              </span>
            </div>

            {/* Slow-Mo Impact Particle Burst */}
            {actionState === 'slam' && (
              <div 
                className="absolute z-30 pointer-events-none flex items-center justify-center"
                style={{ left: '79%', top: '35%' }}
              >
                <div className="w-24 h-24 rounded-full bg-amber-400/30 blur-xl animate-ping" />
                <span className="text-xl sm:text-2xl font-black font-display text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,1)]">
                  ⚡ 50!
                </span>
              </div>
            )}

          </div>

          {/* Action State Marker Overlay */}
          <div className="absolute bottom-3 left-4 z-30 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl border border-neutral-700 text-xs font-bold text-white flex items-center gap-2">
            <span className="text-neutral-400 uppercase text-[10px]">Phase:</span>
            <span className="text-orange-400 uppercase">
              {actionState === 'sprint' && '1. Approach Runway'}
              {actionState === 'lift' && '2. Vertical Launch'}
              {actionState === 'apex' && '3. Apex Hangtime Rotation'}
              {actionState === 'slam' && '4. Rim Flush & Net Snap'}
              {actionState === 'land' && '5. Smooth Hardwood Land'}
            </span>
          </div>

        </div>

        {/* Timeline Scrubber & Speed Controls Footer */}
        <div className="p-4 sm:p-6 bg-neutral-950 space-y-4">
          
          {/* Scrubber Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                Frame-by-Frame Scrubber
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(progress)}% Complete
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={progress}
                onChange={(e) => {
                  setProgress(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
              />
            </div>

            {/* Keyframe Markers along timeline */}
            <div className="flex justify-between text-[10px] text-neutral-500 pt-0.5">
              <span>0% Runway</span>
              <span>25% Takeoff</span>
              <span className="text-amber-400 font-bold">60% Apex Hang</span>
              <span className="text-orange-400 font-bold">80% Rim Flush</span>
              <span>100% Land</span>
            </div>
          </div>

          {/* Control Bar: Play/Pause, Speeds, Camera Angle */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            
            {/* Playback Transport Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pause' : progress >= 100 ? 'Replay' : 'Play'}</span>
              </button>

              <button
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Restart Slow-Mo from 0%"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Slow-Motion Speed Selector */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-orange-400" />
                Speed:
              </span>
              {([0.1, 0.25, 0.5, 1.0] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    sound.playBounce();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    speed === s
                      ? 'bg-orange-500 text-neutral-950 shadow-md font-black scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {s === 0.1 ? '0.1x Matrix' : `${s}x`}
                </button>
              ))}
            </div>

            {/* Camera Angle & Ghost Trail Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
                <button
                  onClick={() => setCameraAngle('broadcast')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    cameraAngle === 'broadcast'
                      ? 'bg-neutral-800 text-amber-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Wide Broadcast Court Angle"
                >
                  Wide Cam
                </button>
                <button
                  onClick={() => setCameraAngle('rim_zoom')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    cameraAngle === 'rim_zoom'
                      ? 'bg-neutral-800 text-amber-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Rim Iso-Cam Zoom"
                >
                  Rim Iso-Cam
                </button>
                <button
                  onClick={() => setCameraAngle('low_floor')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    cameraAngle === 'low_floor'
                      ? 'bg-neutral-800 text-amber-400'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Low Floor Sky-Cam"
                >
                  Floor Cam
                </button>
              </div>

              {/* Ghost Trails Toggle */}
              <button
                onClick={() => setShowGhostTrails(!showGhostTrails)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  showGhostTrails
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
                title="Toggle Phantom Motion Blur Trails"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Motion Trails</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
