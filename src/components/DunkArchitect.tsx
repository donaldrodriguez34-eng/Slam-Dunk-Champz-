import React, { useState } from 'react';
import { Hammer, Sparkles, Lock, Play, Check, Flame, Trophy, ShoppingCart, DollarSign, Award, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DunkMove, UserProfile } from '../types';
import { sound } from '../utils/audio';

interface DunkArchitectProps {
  profile: UserProfile;
  onSaveCustomDunk: (newDunk: DunkMove) => void;
  onOpenStore: () => void;
  onNavigateToArena: () => void;
  onCollectRoyalties: (amount: number) => void;
  customDunks: DunkMove[];
}

const TAKEOFF_OPTIONS = [
  { id: 'Half-Court Sprint', label: 'Half-Court Sprint', desc: 'Maximum kinetic runway velocity', multBonus: 0.1 },
  { id: 'Self-Oop Off Glass', label: 'Self-Oop Off Glass', desc: 'Tossed high against the glass', multBonus: 0.25 },
  { id: 'Baseline Stealth Cut', label: 'Baseline Stealth Cut', desc: 'Low-angle reverse glide takeoff', multBonus: 0.15 },
  { id: 'Trampoline Springboard', label: 'Trampoline Springboard', desc: 'Insane 18-foot vertical launch', multBonus: 0.3 },
];

const TRICK_OPTIONS = [
  { id: 'Windmill Rotator', label: 'Full 360 Windmill', desc: 'Complete arm revolution', multBonus: 0.2 },
  { id: 'Between Both Legs', label: 'Under-Leg Scissor', desc: 'Mid-air weave between thighs', multBonus: 0.35 },
  { id: '540 Gyro Spin', label: '540 Airborne Spin', desc: '1.5 full torso aerial rotations', multBonus: 0.4 },
  { id: 'Behind-Back Wrap', label: 'Spine Ball Wrap', desc: 'Transfers ball behind the shoulder blades', multBonus: 0.3 },
  { id: 'Double Clutch Pump', label: 'Double Clutch Pump', desc: 'Fakes the slam twice in mid-air', multBonus: 0.25 },
];

const FINISH_OPTIONS = [
  { id: 'Two-Hand Rim Shatter', label: 'Two-Hand Rim Shatter', desc: 'Backboard shakes for 5 seconds', multBonus: 0.15 },
  { id: 'One-Hand Tomahawk Spike', label: 'One-Hand Tomahawk Spike', desc: 'Pure downward hammer strike', multBonus: 0.2 },
  { id: 'Elbow-Deep Net Hang', label: 'Elbow-Deep Net Hang', desc: 'Hangs by forearm in the cylinder', multBonus: 0.3 },
  { id: 'Reverse 180 Flush', label: 'Reverse 180 Flush', desc: 'Facing away from the baseline', multBonus: 0.25 },
];

const AURA_OPTIONS = [
  { id: '#f97316', label: 'Solar Fire', bg: 'bg-orange-500' },
  { id: '#06b6d4', label: 'Cyan Lightning', bg: 'bg-cyan-500' },
  { id: '#a855f7', label: 'Phantom Violet', bg: 'bg-purple-500' },
  { id: '#eab308', label: 'Golden Hype', bg: 'bg-amber-400' },
  { id: '#ec4899', label: 'Neon Cyber', bg: 'bg-pink-500' },
];

const POINTS_REQUIRED_TO_CREATE = 1000;

export const DunkArchitect: React.FC<DunkArchitectProps> = ({
  profile,
  onSaveCustomDunk,
  onOpenStore,
  onNavigateToArena,
  onCollectRoyalties,
  customDunks,
}) => {
  const isUnlocked = profile.totalPointsEarned >= POINTS_REQUIRED_TO_CREATE || profile.points >= POINTS_REQUIRED_TO_CREATE;
  const progressPercent = Math.min(100, Math.round((Math.max(profile.totalPointsEarned, profile.points) / POINTS_REQUIRED_TO_CREATE) * 100));

  // Form State
  const [dunkName, setDunkName] = useState('The Skywalker Nova');
  const [nickname, setNickname] = useState('The Rim Obliterator');
  const [description, setDescription] = useState('An unstoppable aerial spectacle invented in the Dunk Lab.');
  const [selectedTakeoff, setSelectedTakeoff] = useState(TAKEOFF_OPTIONS[1].id);
  const [selectedTricks, setSelectedTricks] = useState<string[]>([TRICK_OPTIONS[0].id, TRICK_OPTIONS[1].id]);
  const [selectedFinish, setSelectedFinish] = useState(FINISH_OPTIONS[2].id);
  const [selectedAura, setSelectedAura] = useState(AURA_OPTIONS[0].id);

  // Preview animation
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Total royalties pending across custom dunks
  const pendingRoyalties = customDunks.reduce((sum, d) => sum + (d.creatorEarnings || 0), 0) + (profile.customDunksCreated * 50);

  // Calculate stats dynamically
  const takeoffObj = TAKEOFF_OPTIONS.find((t) => t.id === selectedTakeoff) || TAKEOFF_OPTIONS[0];
  const finishObj = FINISH_OPTIONS.find((f) => f.id === selectedFinish) || FINISH_OPTIONS[0];
  const trickBonus = selectedTricks.reduce((acc, tId) => {
    const t = TRICK_OPTIONS.find((x) => x.id === tId);
    return acc + (t ? t.multBonus : 0);
  }, 0);

  const baseMultiplier = 1.2;
  const totalMultiplier = Number((baseMultiplier + takeoffObj.multBonus + finishObj.multBonus + trickBonus).toFixed(2));
  const estimatedDifficulty = totalMultiplier >= 2.3 ? 'Legendary' : totalMultiplier >= 1.8 ? 'Extreme' : 'Hard';
  const hangtimeEst = Number((1.2 + selectedTricks.length * 0.35 + takeoffObj.multBonus).toFixed(2));

  const toggleTrick = (trickId: string) => {
    sound.playBounce();
    if (selectedTricks.includes(trickId)) {
      if (selectedTricks.length > 1) {
        setSelectedTricks(selectedTricks.filter((t) => t !== trickId));
      }
    } else {
      if (selectedTricks.length < 3) {
        setSelectedTricks([...selectedTricks, trickId]);
      }
    }
  };

  const handlePreviewDunk = () => {
    setIsPreviewing(true);
    sound.playBounce();
    setTimeout(() => {
      sound.playRimSlam();
      sound.playSwoosh();
      sound.playCrowdCheer();
      setIsPreviewing(false);
    }, 1500);
  };

  const handleMintCustomDunk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dunkName.trim()) return;

    const newMove: DunkMove = {
      id: `custom-${Date.now()}`,
      name: dunkName.trim(),
      nickname: nickname.trim() || 'The Signature Weapon',
      difficulty: estimatedDifficulty,
      difficultyStars: estimatedDifficulty === 'Legendary' ? 5 : 4,
      cost: 0,
      unlocked: true,
      hangtimeRequired: hangtimeEst,
      scoreMultiplier: totalMultiplier,
      description: description.trim() || 'A custom-architected signature dunk made in the Dunk Lab.',
      takeoff: selectedTakeoff,
      inAirMotion: selectedTricks.join(' + '),
      finishStyle: selectedFinish,
      auraColor: selectedAura,
      isCustom: true,
      creatorName: profile.name,
      creatorEarnings: 50,
    };

    onSaveCustomDunk(newMove);
    sound.playRimSlam();
    sound.playCrowdCheer();

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: [selectedAura, '#eab308', '#ffffff']
    });

    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3500);
  };

  // If user hasn't earned enough points yet to unlock the lab
  if (!isUnlocked) {
    return (
      <div id="dunk-lab-locked" className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
          
          <div className="w-20 h-20 mx-auto rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-3xl mb-6 shadow-inner text-amber-400">
            <Lock className="w-10 h-10" />
          </div>

          <span className="px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider">
            Dunk Architect License Required
          </span>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wide mt-3 mb-2">
            Unlock The Custom Dunk Lab
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
            When you earn enough points in Slam Dunk Contests, you unlock the ability to architect your own signature moves, set custom flight physics, and earn royalties whenever other dunkers perform or like your creation!
          </p>

          {/* Progress Bar Card */}
          <div className="max-w-md mx-auto my-8 p-5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
              <span className="text-neutral-400">Your Lifetime Points</span>
              <span className="text-amber-400">{Math.max(profile.totalPointsEarned, profile.points).toLocaleString()} / {POINTS_REQUIRED_TO_CREATE.toLocaleString()} PTS</span>
            </div>

            <div className="w-full h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-neutral-400 mt-2">
              Only {(POINTS_REQUIRED_TO_CREATE - Math.max(profile.totalPointsEarned, profile.points)).toLocaleString()} points left to unlock Dunk Architect!
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToArena}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-orange-400" />
              <span>Win Contests in Arena</span>
            </button>

            <button
              onClick={onOpenStore}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4 text-neutral-950" />
              <span>Buy Points & Fast-Track Unlock</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Lab is Unlocked!
  return (
    <div id="dunk-lab-unlocked" className="space-y-6">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Creator Studio & Royalties
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
              ARCHITECT LICENSE ACTIVE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wide text-white">
            Custom Dunk Architect Lab
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
            Engineer your dream slam dunk! Combine unique takeoff angles, mid-air twists, and rim-shattering finishes. Earn royalties (+25 PTS) each time other players use your move!
          </p>
        </div>

        {/* Creator Royalties Pouch */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex items-center gap-4 w-full md:w-auto">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-bold">Your Creator Royalties</div>
            <div className="text-xl font-black font-display text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {pendingRoyalties.toLocaleString()} PTS
            </div>
            <div className="text-[10px] text-neutral-400">From {customDunks.length} Published Moves</div>
          </div>

          <button
            onClick={() => {
              if (pendingRoyalties > 0) {
                onCollectRoyalties(pendingRoyalties);
                sound.playCashRegister();
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
              }
            }}
            disabled={pendingRoyalties <= 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-black text-xs uppercase tracking-wider transition-all shrink-0"
          >
            Claim PTS
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successToast && (
        <div className="bg-emerald-500 text-neutral-950 font-black px-6 py-3 rounded-2xl text-center flex items-center justify-center gap-2 text-sm sm:text-base animate-bounce">
          <Check className="w-5 h-5" />
          <span>Move "{dunkName}" Minted! Equipped to your Arsenal & Published for Royalties!</span>
        </div>
      )}

      {/* Main Creator Grid: Left Form, Right Simulator Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: 7 Columns */}
        <form onSubmit={handleMintCustomDunk} className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          
          {/* Dunk Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 border-b border-neutral-800 pb-2">
              1. Dunk Identity & Lore
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Custom Move Name</label>
                <input
                  type="text"
                  value={dunkName}
                  onChange={(e) => setDunkName(e.target.value)}
                  placeholder="e.g. Eclipse 540 Hammer"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Moniker / Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. The Rim Obliterator"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">Move Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how the dunk electrifies the crowd..."
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 2. Takeoff Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 border-b border-neutral-800 pb-2">
              2. Launch Runway / Takeoff
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TAKEOFF_OPTIONS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTakeoff(t.id);
                    sound.playBounce();
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedTakeoff === t.id
                      ? 'bg-purple-500/20 border-purple-500 text-white shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{t.label}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{t.desc}</div>
                  <div className="text-[10px] text-purple-400 font-bold mt-1">+{t.multBonus}x Multiplier</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Mid-Air Tricks Combo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
                3. Mid-Air Trick Combinations
              </h3>
              <span className="text-xs text-neutral-400">Select 1 to 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TRICK_OPTIONS.map((trick) => {
                const isSelected = selectedTricks.includes(trick.id);
                return (
                  <div
                    key={trick.id}
                    onClick={() => toggleTrick(trick.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{trick.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{trick.desc}</div>
                    </div>
                    <div className="text-[10px] text-amber-400 font-bold mt-1">+{trick.multBonus}x Multiplier</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Finish Style */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 border-b border-neutral-800 pb-2">
              4. Rim Finish & Flush
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FINISH_OPTIONS.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setSelectedFinish(f.id);
                    sound.playBounce();
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedFinish === f.id
                      ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{f.label}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{f.desc}</div>
                  <div className="text-[10px] text-rose-400 font-bold mt-1">+{f.multBonus}x Multiplier</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Visual Trail Aura */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 border-b border-neutral-800 pb-2">
              5. Visual Flight Aura
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {AURA_OPTIONS.map((aura) => (
                <button
                  key={aura.id}
                  type="button"
                  onClick={() => setSelectedAura(aura.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    selectedAura === aura.id
                      ? 'bg-neutral-800 border-white text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${aura.bg}`} />
                  <span>{aura.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mint Button */}
          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Mint & Publish Signature Dunk (+25 PTS Royalties)</span>
            </button>
          </div>

        </form>

        {/* Right Preview Card & Simulator: 5 Columns */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Real-time Visual Simulator Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Live Dunk Simulation</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                {estimatedDifficulty} Tier
              </span>
            </div>

            {/* Mini Simulator Canvas */}
            <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 opacity-20 blur-2xl"
                style={{ backgroundColor: selectedAura }}
              />

              {/* Hoop on Right */}
              <div className="absolute top-6 right-6 flex flex-col items-center">
                <div className="w-16 h-12 border border-white/60 bg-white/5 rounded-xs flex items-center justify-center">
                  <div className="w-6 h-5 border border-orange-500" />
                </div>
                <div className="w-8 h-2 bg-orange-500 -mt-1 -ml-6" />
              </div>

              {/* Animated Avatar */}
              <div className={`transition-all duration-700 flex flex-col items-center ${
                isPreviewing ? 'translate-x-12 -translate-y-6 scale-125' : ''
              }`}>
                <span className="text-4xl animate-pulse">⛹️‍♂️</span>
                <span className="text-xl -mt-2">🏀</span>
              </div>

              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] text-neutral-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl">
                <span>{selectedTakeoff}</span>
                <span>{selectedFinish}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreviewDunk}
              disabled={isPreviewing}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{isPreviewing ? 'Simulating Flight...' : 'Test Flight Simulation'}</span>
            </button>
          </div>

          {/* Stats & Multipliers Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Calculated Flight Metrics
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Score Multiplier</div>
                <div className="text-2xl font-black font-display text-amber-400 mt-0.5">
                  {totalMultiplier}x
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Hangtime Required</div>
                <div className="text-2xl font-black font-display text-cyan-400 mt-0.5">
                  {hangtimeEst}s
                </div>
              </div>
            </div>

            <div className="bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800 text-xs text-neutral-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Combos Active:</span>
                <span className="font-bold text-white">{selectedTricks.length} Mid-Air Tricks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Estimated Judge Rating:</span>
                <span className="font-bold text-amber-400">48 - 50 Points</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Community Royalties:</span>
                <span className="font-bold text-emerald-400">+25 PTS per use</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
