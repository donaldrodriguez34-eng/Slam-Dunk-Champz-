import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw, Sparkles, Flame, CheckCircle, Video, ArrowRight, Shield, Award, Zap, Shirt, Gauge, Film, Camera, Dumbbell, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DunkMove, UserProfile, ContestRound, JudgeScore, HighlightVideo } from '../types';
import { CELEBRITY_JUDGES, RIVAL_DUNKERS } from '../data/initialDunks';
import { sound } from '../utils/audio';
import { JerseyAvatar } from './JerseyAvatar';
import { DEFAULT_AVATAR_CONFIG } from '../data/teamColorSchemes';
import { SloMoReplayModal } from './SloMoReplayModal';
import { calculateOvr } from './CharacterCreator';

interface ContestArenaProps {
  unlockedDunks: DunkMove[];
  profile: UserProfile;
  onWinContest: (pointsEarned: number) => void;
  onSaveHighlight: (highlight: Partial<HighlightVideo>) => void;
  onOpenStore: () => void;
  onNavigateToVault: () => void;
  onNavigateToCreator: () => void;
  onNavigateToCharacter?: () => void;
  onOpenAvatarEditor?: () => void;
}

type ContestPhase = 'select' | 'ready' | 'runway' | 'elevation' | 'flush' | 'judging' | 'results';

export const ContestArena: React.FC<ContestArenaProps> = ({
  unlockedDunks,
  profile,
  onWinContest,
  onSaveHighlight,
  onOpenStore,
  onNavigateToVault,
  onNavigateToCreator,
  onNavigateToCharacter,
  onOpenAvatarEditor,
}) => {
  const [selectedDunk, setSelectedDunk] = useState<DunkMove>(unlockedDunks[0] || {} as DunkMove);
  const [phase, setPhase] = useState<ContestPhase>('select');
  const [roundNumber, setRoundNumber] = useState(1);
  const [rivalIndex, setRivalIndex] = useState(0);

  // Slow-motion gameplay speed state
  const [dunkSpeed, setDunkSpeed] = useState<1.0 | 0.5 | 0.25>(1.0);
  const [isSloMoModalOpen, setIsSloMoModalOpen] = useState(false);
  
  // Timing game state
  const [meterValue, setMeterValue] = useState(0);
  const [meterDirection, setMeterDirection] = useState<1 | -1>(1);
  const [elevationScore, setElevationScore] = useState(0);
  const [flushScore, setFlushScore] = useState(0);
  const [timingResult, setTimingResult] = useState<'PERFECT' | 'GREAT' | 'GOOD' | 'CLANK'>('GOOD');
  
  // Animation state
  const [playerPos, setPlayerPos] = useState({ x: 15, y: 70 });
  const [ballPos, setBallPos] = useState({ x: 22, y: 64 });
  const [ballRotation, setBallRotation] = useState(0);
  const [rimRattling, setRimRattling] = useState(false);
  const [flashBulbs, setFlashBulbs] = useState(false);

  // Victory animation states
  const [victoryFlashActive, setVictoryFlashActive] = useState(false);
  const [screenShakeActive, setScreenShakeActive] = useState(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scores
  const [judgesScores, setJudgesScores] = useState<JudgeScore[]>([]);
  const [userFinalScore, setUserFinalScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(42);
  const [hasWon, setHasWon] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [highlightSaved, setHighlightSaved] = useState(false);

  // Player attributes & overall rating
  const attrs = profile.attributes || {
    verticalLeap: 70,
    hangtimeFloat: 68,
    takeoffVelocity: 72,
    rimImpactForce: 67,
    timingPrecision: 71,
  };
  const playerOvr = calculateOvr(attrs);

  const rival = RIVAL_DUNKERS[rivalIndex % RIVAL_DUNKERS.length];
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup victory animation timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  const triggerVictoryImpactEffects = () => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);

    setVictoryFlashActive(true);
    setScreenShakeActive(true);
    sound.playRimSlam();

    shakeTimeoutRef.current = setTimeout(() => {
      setScreenShakeActive(false);
    }, 800);

    flashTimeoutRef.current = setTimeout(() => {
      setVictoryFlashActive(false);
    }, 950);
  };

  // Make sure selectedDunk is valid
  useEffect(() => {
    if (unlockedDunks.length > 0 && (!selectedDunk.id || !unlockedDunks.some(d => d.id === selectedDunk.id))) {
      setSelectedDunk(unlockedDunks[0]);
    }
  }, [unlockedDunks, selectedDunk]);

  // Handle meter oscillation in elevation & flush phases (scaled by dunkSpeed and softened by hangtimeFloat)
  useEffect(() => {
    if (phase === 'elevation' || phase === 'flush') {
      const baseSpeed = phase === 'elevation' ? 2.5 : 3.2;
      const floatFactor = Math.max(0.75, 1 - ((attrs.hangtimeFloat - 60) / 40) * 0.2);
      const speed = baseSpeed * dunkSpeed * floatFactor;
      const interval = setInterval(() => {
        setMeterValue((prev) => {
          let next = prev + speed * meterDirection;
          if (next >= 100) {
            setMeterDirection(-1);
            return 100;
          }
          if (next <= 0) {
            setMeterDirection(1);
            return 0;
          }
          return next;
        });
      }, 16);
      return () => clearInterval(interval);
    }
  }, [phase, meterDirection, dunkSpeed, attrs.hangtimeFloat]);

  // Start dunk attempt
  const startDunkRun = () => {
    setPhase('runway');
    setHighlightSaved(false);
    setPlayerPos({ x: 15, y: 70 });
    setBallPos({ x: 22, y: 64 });
    setBallRotation(0);
    setRimRattling(false);
    setFlashBulbs(false);
    
    if (dunkSpeed < 1.0) {
      sound.playSlowMoWhoosh();
    } else {
      sound.playBounce();
    }

    // Step 1: Runway sprint (scaled by dunkSpeed and boosted by takeoffVelocity)
    let progress = 0;
    const velBoost = 1 + ((attrs.takeoffVelocity - 60) / 40) * 0.22;
    const step = 2.5 * dunkSpeed * velBoost;
    const runInterval = setInterval(() => {
      progress += step;
      setPlayerPos((p) => ({ ...p, x: 15 + progress * 0.35 }));
      setBallPos((b) => ({ ...b, x: 22 + progress * 0.35 }));
      
      if (progress % 20 < step) {
        sound.playBounce();
      }

      if (progress >= 100) {
        clearInterval(runInterval);
        setPhase('elevation');
        setMeterValue(0);
        setMeterDirection(1);
      }
    }, 20);
  };

  // User taps meter during Elevation
  const handleElevationTap = () => {
    if (dunkSpeed < 1.0) {
      sound.playSlowMoWhoosh();
    } else {
      sound.playBounce();
    }

    // Sweet spot tolerance is expanded by timingPrecision
    const precisionBonus = ((attrs.timingPrecision - 60) / 40) * 8;
    const distance = Math.max(0, Math.abs(meterValue - 78) - precisionBonus);
    const score = Math.max(0, 100 - distance * 3.5);
    setElevationScore(score);

    // Animate player jumping into air (altitude higher with verticalLeap attribute)
    const apexBoost = Math.round(((attrs.verticalLeap - 60) / 40) * 12);
    setPlayerPos({ x: 55, y: Math.max(20, 40 - apexBoost) });
    setBallPos({ x: 60, y: Math.max(12, 32 - apexBoost) });
    setBallRotation(selectedDunk.difficulty === 'Legendary' ? 720 : 360);

    // Proceed to flush window
    setPhase('flush');
    setMeterValue(0);
    setMeterDirection(1);
  };

  // User taps meter during Flush
  const handleFlushTap = () => {
    // Sweet spot expanded by timingPrecision
    const precisionBonus = ((attrs.timingPrecision - 60) / 40) * 8;
    const distance = Math.max(0, Math.abs(meterValue - 82) - precisionBonus);
    const score = Math.max(0, 100 - distance * 4);
    setFlushScore(score);

    // Calculate total quality
    const avgScore = (elevationScore + score) / 2;
    let timing: 'PERFECT' | 'GREAT' | 'GOOD' | 'CLANK' = 'GOOD';
    
    if (avgScore >= 88) timing = 'PERFECT';
    else if (avgScore >= 72) timing = 'GREAT';
    else if (avgScore >= 50) timing = 'GOOD';
    else timing = 'CLANK';

    setTimingResult(timing);

    if (timing === 'CLANK') {
      sound.playRimClank();
      setPlayerPos({ x: 78, y: 55 });
      setBallPos({ x: 88, y: 75 });
    } else {
      if (dunkSpeed < 1.0) {
        sound.playSlowMoSlam();
      } else {
        sound.playRimSlam();
      }
      sound.playSwoosh();
      sound.playCrowdCheer();
      setRimRattling(true);
      setFlashBulbs(true);
      setPlayerPos({ x: 80, y: 42 });
      setBallPos({ x: 84, y: 46 });
    }

    // Move to judging table phase (longer delay in slow-mo for dramatic hangtime)
    const delay = dunkSpeed < 1.0 ? Math.round(1500 / dunkSpeed) : 1000;
    setTimeout(() => {
      calculateJudgesScores(timing, avgScore);
    }, delay);
  };

  const calculateJudgesScores = (timing: 'PERFECT' | 'GREAT' | 'GOOD' | 'CLANK', quality: number) => {
    setPhase('judging');

    const mult = selectedDunk.scoreMultiplier;
    const scores: JudgeScore[] = CELEBRITY_JUDGES.map((judge, idx) => {
      let base = 7;
      if (timing === 'PERFECT') base = 10;
      else if (timing === 'GREAT') base = 9;
      else if (timing === 'GOOD') base = 8;
      else base = 6;

      // Small judge personality variance & attribute influence
      if (judge.name.includes('Shaq') && (selectedDunk.finishStyle.includes('Flush') || attrs.rimImpactForce >= 80)) {
        base = Math.min(10, base + 1);
      }
      if (judge.name.includes('Vince') && (selectedDunk.name.includes('360') || selectedDunk.name.includes('Honey') || attrs.verticalLeap >= 85)) {
        base = Math.min(10, base + 1);
      }
      if (judge.name.includes('Dominique') && (selectedDunk.name.includes('Windmill') || attrs.takeoffVelocity >= 85)) {
        base = Math.min(10, base + 1);
      }

      // Add comments
      let comment = 'Solid execution and nice approach.';
      if (base === 10) {
        comment = judge.id === 'judge-3' ? "LET'S GO HOME! IT IS OVER! 50!" : "PURE ARTISTRY IN FLIGHT! 10/10!";
      } else if (base === 9) {
        comment = "Electrifying hangtime, the arena went wild!";
      } else if (base === 8) {
        comment = "Good vertical, needed just a touch more snap on the rim.";
      } else {
        comment = "Tough break on the finish, but great effort.";
      }

      return {
        judgeId: judge.id,
        judgeName: judge.name,
        judgeRole: judge.role,
        judgeAvatar: judge.avatar,
        score: base,
        comment,
      };
    });

    setJudgesScores(scores);

    // Tally total
    const total = scores.reduce((acc, j) => acc + j.score, 0);
    setUserFinalScore(total);

    // Opponent score
    const oppScore = Math.min(50, Math.max(38, Math.round(rival.baseScore + (Math.random() * 4 - 2))));
    setRivalScore(oppScore);

    // Play judge chimes sequentially
    scores.forEach((_, i) => {
      setTimeout(() => {
        sound.playJudgeChime();
      }, i * 350);
    });

    // Move to final results
    setTimeout(() => {
      setPhase('results');
      const won = total >= oppScore;
      setHasWon(won);

      if (won) {
        const basePts = 350;
        const perfectBonus = total === 50 ? 150 : 0;
        const difficultyBonus = selectedDunk.difficultyStars * 40;
        const attributeBonus = Math.round(((attrs.takeoffVelocity - 60) / 40) * 50 + ((attrs.rimImpactForce - 60) / 40) * 35);
        const earned = Math.round((basePts + perfectBonus + difficultyBonus + attributeBonus) * selectedDunk.scoreMultiplier);
        
        setPointsAwarded(earned);
        onWinContest(earned);
        sound.playCrowdCheer();

        // Trigger impactful visual flash and screen-shake animation
        triggerVictoryImpactEffects();

        confetti({
          particleCount: 120,
          spread: 85,
          origin: { y: 0.55 }
        });
      } else {
        sound.playBuzzer();
      }
    }, scores.length * 350 + 600);
  };

  const handleCreateHighlightFromDunk = () => {
    const newHighlight: Partial<HighlightVideo> = {
      title: `${selectedDunk.name} - ${userFinalScore} PTS Contest Slam!`,
      dunkerName: profile.name,
      dunkMoveName: selectedDunk.name,
      score: userFinalScore,
      likes: 1,
      likedByUser: true,
      views: 12,
      thumbnailGradient: selectedDunk.difficulty === 'Legendary' 
        ? 'from-cyan-600 via-indigo-700 to-neutral-900' 
        : 'from-orange-600 via-amber-700 to-neutral-900',
      filter: selectedDunk.difficulty === 'Legendary' ? 'neon' : 'fire',
      sticker: userFinalScore === 50 ? 'CERTIFIED 50 🌟' : 'CONTEST WINNER 🏆',
      isUserSubmission: true,
      comments: [
        { user: 'SlamDunkOfficial', text: `Verified in Round ${roundNumber} with a ${timingResult} rating!`, time: 'Just now' }
      ]
    };

    onSaveHighlight(newHighlight);
    setHighlightSaved(true);
    sound.playJudgeChime();
  };

  const nextContestMatch = () => {
    setRoundNumber((r) => r + 1);
    setRivalIndex((i) => i + 1);
    setPhase('select');
  };

  return (
    <div 
      id="contest-arena" 
      className={`space-y-6 relative transition-transform ${screenShakeActive ? 'animate-victory-shake' : ''}`}
    >
      {/* Visual Flash and Shockwave Overlay for Victory */}
      {victoryFlashActive && (
        <div 
          id="victory-impact-flash"
          className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* Strobe Flash Canvas */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-white to-orange-400 animate-victory-flash mix-blend-screen opacity-95" />
          <div className="absolute inset-0 bg-white/70 animate-victory-flash" />

          {/* Dynamic Expanding Shockwave Rings */}
          <div className="absolute w-[440px] h-[440px] rounded-full border-4 border-amber-300 animate-victory-shockwave shadow-[0_0_80px_rgba(251,191,36,0.9)]" />
          <div className="absolute w-[640px] h-[640px] rounded-full border-2 border-white animate-victory-shockwave [animation-delay:100ms] shadow-[0_0_100px_rgba(255,255,255,0.95)]" />

          {/* Radiant Anamorphic Victory Light Rays */}
          <div className="absolute w-[180%] h-3 bg-gradient-to-r from-transparent via-amber-200 to-transparent rotate-12 animate-victory-flash opacity-90 blur-[1px]" />
          <div className="absolute w-[180%] h-3 bg-gradient-to-r from-transparent via-white to-transparent -rotate-12 animate-victory-flash opacity-90 blur-[1px]" />

          {/* Central Victory Splash Callout */}
          <div className="relative z-10 flex flex-col items-center justify-center animate-flash-score">
            <div className="px-6 py-2.5 rounded-full bg-neutral-950/85 border-2 border-amber-400 text-amber-300 font-display font-black text-2xl sm:text-4xl tracking-widest uppercase shadow-[0_0_50px_rgba(245,158,11,0.85)] backdrop-blur-md">
              ⚡ CHAMPION VICTORY! ⚡
            </div>
          </div>
        </div>
      )}
      
      {/* Contest Header & Rival Matchup Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* User Side */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div 
              id="contestant-avatar-container"
              onClick={() => onOpenAvatarEditor && onOpenAvatarEditor()}
              className="relative cursor-pointer group"
              title="Click to edit jersey and avatar"
            >
              <JerseyAvatar
                avatar={profile.avatar || DEFAULT_AVATAR_CONFIG}
                size="md"
                showGlow
                animate
              />
              <div 
                className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md text-[10px] font-black border shadow-md flex items-center gap-0.5"
                style={{
                  backgroundColor: profile.avatar?.primaryColor || '#ef4444',
                  borderColor: profile.avatar?.secondaryColor || '#000000',
                  color: profile.avatar?.numberColor || '#ffffff',
                }}
              >
                #{profile.avatar?.jerseyNumber ?? 23}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Contestant</span>
                <span className="text-[11px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                  {profile.rankTitle}
                </span>
                {onOpenAvatarEditor && (
                  <button
                    id="arena-edit-avatar-btn"
                    onClick={() => {
                      sound.playBounce();
                      onOpenAvatarEditor();
                    }}
                    className="text-[10px] font-semibold text-neutral-400 hover:text-orange-400 flex items-center gap-1 bg-neutral-850 hover:bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700/60 transition-colors"
                  >
                    <Shirt className="w-3 h-3 text-orange-400" />
                    <span>Edit Jersey</span>
                  </button>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wide">
                {profile.name}
              </h3>
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>Contest #{roundNumber}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">{profile.points} PTS Available</span>
              </div>
            </div>
          </div>

          {/* VS Pill */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-neutral-950 border-2 border-orange-500/40 flex items-center justify-center font-display font-black text-xl italic text-orange-400 shadow-inner">
              VS
            </div>
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-1">
              Round {roundNumber} of 3
            </span>
          </div>

          {/* Rival Side */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  {rival.team}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Rival</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wide">
                {rival.name}
              </h3>
              <div className="text-xs text-neutral-400">
                Specialty: <span className="text-neutral-300 font-semibold">{rival.specialty}</span>
              </div>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-800 p-0.5 border border-neutral-700">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                {rival.avatar}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Dunk Stage / Canvas Court */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[520px] bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none">
        
        {/* Arena Backdrop: Lights & Crowd */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-950/80 to-amber-950/30 pointer-events-none" />
        
        {/* Spotlight Beam */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Flashbulbs on perfect dunk */}
        {flashBulbs && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-xs transition-opacity duration-300 pointer-events-none animate-pulse" />
        )}

        {/* Hardwood Court Floor */}
        <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 bg-gradient-to-t from-amber-950/70 to-amber-900/30 border-t-2 border-amber-600/30 flex items-center justify-center">
          <div className="w-full h-full opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
          {/* Free throw paint line */}
          <div className="absolute bottom-0 left-1/3 w-px h-full bg-amber-500/40" />
          <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-28 h-28 rounded-full border-2 border-amber-500/30 border-b-transparent pointer-events-none" />
        </div>

        {/* Basketball Rim & Backboard (Right side of stage) */}
        <div className={`absolute top-12 sm:top-16 right-8 sm:right-16 z-10 transition-transform ${rimRattling ? 'animate-rim-rattle' : ''}`}>
          {/* Support pole & arm */}
          <div className="absolute -top-6 -right-4 w-4 h-56 bg-neutral-700 border-r border-neutral-600" />
          
          {/* Backboard glass */}
          <div className="w-24 sm:w-32 h-20 sm:h-24 bg-white/10 backdrop-blur-md border-2 border-white/60 rounded-sm shadow-xl relative flex items-center justify-center">
            {/* Target square */}
            <div className="w-10 sm:w-14 h-8 sm:h-10 border-2 border-orange-500" />
            
            {/* Orange Rim */}
            <div className="absolute -bottom-1 -left-12 sm:-left-16 w-12 sm:w-16 h-3 bg-orange-500 rounded-sm shadow-md flex items-center justify-center">
              {/* White Net */}
              <div className="absolute top-2 w-10 sm:w-12 h-12 border-x-2 border-b-2 border-white/70 border-dashed rounded-b-xl opacity-80" />
            </div>
          </div>
        </div>

        {/* Player & Basketball Avatar in Arena */}
        <div 
          className="absolute z-20 transition-all duration-200 pointer-events-none"
          style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
        >
          {/* Dynamic player aura based on move */}
          <div 
            className="w-16 h-20 flex flex-col items-center justify-center relative -translate-x-1/2 -translate-y-1/2"
          >
            <div 
              className="absolute inset-0 rounded-full blur-md opacity-40"
              style={{ backgroundColor: selectedDunk.auraColor || profile.avatar?.primaryColor || '#f97316' }}
            />
            <span className="text-4xl sm:text-5xl filter drop-shadow-lg transform transition-transform duration-300">
              {phase === 'runway' ? '🏃‍♂️' : phase === 'elevation' ? '🧗‍♂️' : phase === 'flush' ? '💥' : '⛹️‍♂️'}
            </span>
            <span 
              className="mt-0.5 px-1 rounded text-[9px] font-black leading-tight border shadow-md"
              style={{
                backgroundColor: profile.avatar?.primaryColor || '#ef4444',
                borderColor: profile.avatar?.secondaryColor || '#000000',
                color: profile.avatar?.numberColor || '#ffffff',
              }}
            >
              #{profile.avatar?.jerseyNumber ?? 23}
            </span>
          </div>
        </div>

        {/* Basketball Flight with trail */}
        <div
          className="absolute z-30 transition-all duration-150 pointer-events-none"
          style={{ 
            left: `${ballPos.x}%`, 
            top: `${ballPos.y}%`, 
            transform: `translate(-50%, -50%) rotate(${ballRotation}deg)` 
          }}
        >
          <div className="relative">
            <span className="text-2xl sm:text-3xl filter drop-shadow">🏀</span>
            {phase === 'flush' && (
              <div 
                className="absolute -inset-2 rounded-full blur-sm opacity-80"
                style={{ backgroundColor: selectedDunk.auraColor || '#f97316' }}
              />
            )}
          </div>
        </div>

        {/* Live Slow-Mo Broadcast Watermark on Court */}
        {dunkSpeed < 1.0 && (
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-neutral-700/80 text-[10px] font-black text-white uppercase tracking-wider shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span>SLOW-MO CAM [{dunkSpeed}X] // {dunkSpeed === 0.25 ? '240 FPS ULTRA' : '120 FPS'}</span>
            </div>
          </div>
        )}

        {/* Stage Top Bar: Move Name & Status Overlay */}
        <div className="relative z-30 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
              <span className="text-xs text-neutral-400 font-bold uppercase mr-2">Selected Dunk:</span>
              <span className="text-sm sm:text-base font-black text-white font-display uppercase tracking-wide">
                {selectedDunk.name}
              </span>
              <span className="ml-2 text-xs font-bold text-amber-400">
                {selectedDunk.scoreMultiplier}x
              </span>
            </div>

            {/* Player Attributes Status Badge */}
            <button
              type="button"
              onClick={onNavigateToCharacter}
              className="bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-400/50 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer shadow-sm text-left group"
              title="Click to upgrade player attributes with Dunk Points"
            >
              <Dumbbell className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black text-white">{playerOvr} OVR</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase hidden sm:inline">{profile.bio?.archetype || 'Skywalker'}</span>
              <span className="text-[9px] text-neutral-400 group-hover:text-orange-400 font-medium">Build +</span>
            </button>

            {selectedDunk.isCustom && (
              <span className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Custom Move
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Slow-Mo Replay Trigger from Court */}
            <button
              type="button"
              onClick={() => {
                setIsSloMoModalOpen(true);
                sound.playSlowMoWhoosh();
              }}
              className="px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              title="Open Slow-Mo Replay Theatre"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slow-Mo Replay</span>
            </button>

            {phase !== 'select' && (
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-neutral-400">Status:</span>
                <span className={`text-xs sm:text-sm font-black uppercase px-3 py-1 rounded-lg ${
                  phase === 'runway' ? 'bg-amber-500 text-neutral-950 animate-pulse' :
                  phase === 'elevation' ? 'bg-sky-500 text-neutral-950 font-black' :
                  phase === 'flush' ? 'bg-orange-500 text-neutral-950 font-black' :
                  phase === 'judging' ? 'bg-purple-500 text-white' : 'bg-neutral-800 text-white'
                }`}>
                  {phase === 'runway' ? 'Sprint Runway' :
                   phase === 'elevation' ? 'Trigger Hangtime!' :
                   phase === 'flush' ? 'Slam Timing!' :
                   phase === 'judging' ? 'Judges Scoring...' : 'Finished'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Timing Gauge Bar (Visible during Elevation & Flush) */}
        {(phase === 'elevation' || phase === 'flush') && (
          <div className="relative z-40 mx-auto w-11/12 max-w-xl p-4 bg-neutral-950/90 border border-neutral-700 rounded-2xl backdrop-blur-lg shadow-2xl mb-4 text-center">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2">
              <span className="text-amber-400">
                {phase === 'elevation' ? 'Tap for Max Hangtime' : 'Tap for Perfect Rim Flush'}
              </span>
              <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                <span>Green Sweet Spot: {phase === 'elevation' ? '70-86%' : '74-90%'}</span>
                {attrs.timingPrecision > 70 && (
                  <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/30">
                    +{Math.round(((attrs.timingPrecision - 60) / 40) * 8)}% Precision
                  </span>
                )}
              </span>
            </div>

            {/* Gauge Track */}
            <div className="relative h-7 sm:h-9 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden flex items-center">
              {/* Sweet spot target zone widened by timingPrecision */}
              <div 
                className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/40 via-emerald-400/80 to-emerald-500/40 border-x-2 border-emerald-300"
                style={{
                  left: phase === 'elevation' ? '68%' : '72%',
                  width: `${18 + Math.round(((attrs.timingPrecision - 60) / 40) * 12)}%`,
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-neutral-950 uppercase tracking-widest">
                  PERFECT
                </span>
              </div>

              {/* Oscillating needle / meter */}
              <div 
                className="absolute top-0 bottom-0 w-3 bg-white shadow-lg shadow-white/80 rounded-full transition-all duration-75"
                style={{ left: `calc(${meterValue}% - 6px)` }}
              />
            </div>

            {/* Tap Action Button */}
            <button
              id="gauge-tap-action-btn"
              onClick={phase === 'elevation' ? handleElevationTap : handleFlushTap}
              className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-neutral-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.98] transition-transform"
            >
              {phase === 'elevation' ? '🚀 LAUNCH HANGTIME (TAP)' : '💥 SLAM IT DOWN! (TAP)'}
            </button>
          </div>
        )}

        {/* Start Button in Select Phase */}
        {phase === 'select' && (
          <div className="relative z-30 p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-4 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent">
            <div>
              <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Ready to Fly?</div>
              <div className="text-lg font-bold text-white">
                Attempt <span className="text-orange-400">{selectedDunk.name}</span> in Round {roundNumber}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
              {/* Slow-Motion Speed Selector */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700/80 p-1 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-orange-400" />
                  Speed:
                </span>
                {([1.0, 0.5, 0.25] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDunkSpeed(s);
                      if (s < 1.0) sound.playSlowMoWhoosh();
                      else sound.playBounce();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                      dunkSpeed === s
                        ? 'bg-orange-500 text-neutral-950 font-black shadow-md scale-105'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {s === 1.0 ? '1x Real' : s === 0.5 ? '0.5x Slo-Mo' : '0.25x Matrix'}
                  </button>
                ))}
              </div>

              {/* Instant Slow-Mo Replay Theatre Button */}
              <button
                id="preview-slomo-theater-btn"
                type="button"
                onClick={() => {
                  setIsSloMoModalOpen(true);
                  sound.playSlowMoWhoosh();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-orange-500/50 text-orange-400 hover:text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Preview this move in slow-motion with frame scrubber and camera angles"
              >
                <Film className="w-4 h-4 text-orange-400" />
                <span>Slow-Mo Replay</span>
              </button>

              <button
                id="change-dunk-btn"
                onClick={onNavigateToVault}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors"
              >
                Browse Vault
              </button>
              
              <button
                id="start-dunk-run-btn"
                onClick={startDunkRun}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-neutral-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-neutral-950" />
                <span>Take The Court {dunkSpeed < 1.0 ? `(${dunkSpeed}x)` : ''}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Move Selector Carousel (When in select phase) */}
      {phase === 'select' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>Select Move for This Round</span>
              <span className="text-xs text-neutral-400 font-normal">({unlockedDunks.length} unlocked)</span>
            </h4>

            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToCreator}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Craft Custom Dunk</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {unlockedDunks.map((dunk) => {
              const isSelected = selectedDunk.id === dunk.id;
              return (
                <div
                  key={dunk.id}
                  id={`select-dunk-${dunk.id}`}
                  onClick={() => {
                    setSelectedDunk(dunk);
                    sound.playBounce();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-800/90 border-orange-500 shadow-md shadow-orange-500/20 scale-[1.02]'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-amber-400">{dunk.difficulty}</span>
                      <span className="text-neutral-400">{dunk.scoreMultiplier}x</span>
                    </div>
                    <div className="font-display font-black text-sm text-white truncate">
                      {dunk.name}
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                      {dunk.description}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Hangtime: {dunk.hangtimeRequired}s</span>
                    {isSelected && (
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Celebrity Judges Scoring Table (Judging & Results phase) */}
      {(phase === 'judging' || phase === 'results') && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
            <div>
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">Official Score Table</div>
              <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase">
                Celebrity Judges Tally
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Total User Score</span>
                <span className="font-display font-black text-3xl sm:text-4xl text-amber-400">
                  {userFinalScore} <span className="text-base text-neutral-400">/ 50</span>
                </span>
              </div>
            </div>
          </div>

          {/* 5 Judge Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {judgesScores.map((j) => (
              <div 
                key={j.judgeId}
                className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{j.judgeAvatar}</span>
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-white truncate">{j.judgeName}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{j.judgeRole}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-300 italic">
                    "{j.comment}"
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-800 text-center">
                  <div className={`font-display font-black text-3xl sm:text-4xl ${
                    j.score === 10 ? 'text-amber-400 animate-bounce' : 'text-white'
                  }`}>
                    {j.score}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Match Outcome Card (When in results phase) */}
          {phase === 'results' && (
            <div className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 relative overflow-hidden transition-all duration-300 ${
              hasWon 
                ? 'bg-gradient-to-b from-orange-500/25 via-amber-500/15 to-neutral-950 border-orange-500/60 shadow-[0_0_50px_rgba(249,115,22,0.25)]'
                : 'bg-neutral-950 border-neutral-800'
            } ${screenShakeActive && hasWon ? 'ring-4 ring-amber-400/80 shadow-[0_0_80px_rgba(251,191,36,0.6)]' : ''}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Round {roundNumber} Match Result
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-wide mt-1">
                  {hasWon ? '🏆 VICTORY! YOU DEFEATED THE RIVAL!' : 'ROUND LOSS - RIVAL OUTSCORED YOU'}
                </h2>
                <div className="flex items-center justify-center gap-6 mt-2 text-sm">
                  <span className="text-amber-400 font-bold">You: {userFinalScore} PTS</span>
                  <span className="text-neutral-500">|</span>
                  <span className="text-neutral-300">Rival ({rival.name}): {rivalScore} PTS</span>
                </div>
              </div>

              {hasWon && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm sm:text-base shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>+{pointsAwarded.toLocaleString()} Dunk Points Earned!</span>
                  </div>

                  <button
                    type="button"
                    onClick={triggerVictoryImpactEffects}
                    title="Replay the screen shake and victory strobe flash"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-400/50 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <span>⚡ Replay Flash & Shake</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  id="results-slomo-replay-btn"
                  type="button"
                  onClick={() => {
                    setIsSloMoModalOpen(true);
                    sound.playSlowMoWhoosh();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neutral-850 to-neutral-900 hover:from-neutral-800 hover:to-neutral-850 text-orange-400 hover:text-amber-300 font-bold text-xs sm:text-sm border border-neutral-700 hover:border-orange-500/50 transition-all flex items-center gap-2 shadow-md hover:scale-105 active:scale-95"
                >
                  <Film className="w-4 h-4 text-orange-400" />
                  <span>🎬 Slow-Mo Replay Theatre</span>
                </button>

                {!highlightSaved ? (
                  <button
                    id="save-highlight-btn"
                    onClick={handleCreateHighlightFromDunk}
                    className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 border border-neutral-700"
                  >
                    <Video className="w-4 h-4 text-orange-400" />
                    <span>Save to Highlights Reel</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4" />
                    <span>Published to Highlights Feed!</span>
                  </div>
                )}

                <button
                  id="next-round-btn"
                  onClick={nextContestMatch}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <span>Next Contest</span>
                  <ArrowRight className="w-4 h-4 text-neutral-950" />
                </button>

                <button
                  id="open-store-from-arena-btn"
                  onClick={onOpenStore}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-bold text-xs sm:text-sm border border-neutral-700 transition-colors"
                >
                  Buy Points / Boost
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Slow-Mo Replay Theatre Modal */}
      <SloMoReplayModal
        isOpen={isSloMoModalOpen}
        onClose={() => setIsSloMoModalOpen(false)}
        dunk={selectedDunk}
        avatar={profile.avatar || DEFAULT_AVATAR_CONFIG}
        playerName={profile.name}
        timingAccuracy={timingResult}
        score={userFinalScore || 50}
      />

    </div>
  );
};
