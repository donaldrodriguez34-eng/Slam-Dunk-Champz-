import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Wind, 
  Target, 
  Flame, 
  Award, 
  ShoppingCart, 
  Check, 
  RotateCcw, 
  Palette, 
  Shirt, 
  Sliders, 
  Trophy,
  Dumbbell,
  Shield,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, PlayerAttributes, CharacterBio, AvatarConfig, TeamColorScheme } from '../types';
import { JerseyAvatar } from './JerseyAvatar';
import { TEAM_COLOR_SCHEMES, QUICK_JERSEY_NUMBERS, SKIN_TONES, HAIR_STYLES } from '../data/teamColorSchemes';
import { sound } from '../utils/audio';

interface CharacterCreatorProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenStore: () => void;
  onNavigateToArena: () => void;
}

export function getAttributeUpgradeCost(currentValue: number): number {
  if (currentValue >= 99) return 0;
  if (currentValue < 75) return 150;
  if (currentValue < 85) return 250;
  if (currentValue < 95) return 400;
  return 600;
}

export function calculateOvr(attrs: PlayerAttributes): number {
  return Math.round(
    (attrs.verticalLeap +
      attrs.hangtimeFloat +
      attrs.takeoffVelocity +
      attrs.rimImpactForce +
      attrs.timingPrecision) /
      5
  );
}

const ARCHETYPES = [
  {
    id: 'Slashing Skywalker' as const,
    title: 'Slashing Skywalker',
    desc: 'High-altitude vertical elevation, explosive vertical leap, and towering apex hangtime.',
    icon: '🦅',
    primaryStat: 'Vertical Leap',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'Aerospace Wing' as const,
    title: 'Aerospace Wing',
    desc: 'Uncanny air drift, glider hangtime, and fluid mid-air rotation control.',
    icon: '🚀',
    primaryStat: 'Hangtime Float',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'Power Rim Destroyer' as const,
    title: 'Power Rim Destroyer',
    desc: 'Devastating rim violence, violent rattles, backboard shockwaves, and Shaq judge bonuses.',
    icon: '💥',
    primaryStat: 'Rim Impact Force',
    color: 'from-red-500 to-orange-600',
  },
  {
    id: 'Freestyle Aerialist' as const,
    title: 'Freestyle Aerialist',
    desc: 'Acrobatic twists, 360/540 gyro spins, self-oops, and maximum style multipliers.',
    icon: '🌪️',
    primaryStat: 'Takeoff Velocity',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'Clutch Hangtime Maestro' as const,
    title: 'Clutch Hangtime Maestro',
    desc: 'Unshakeable timing precision, expanded green sweet-spot windows on meters.',
    icon: '🎯',
    primaryStat: 'Timing Precision',
    color: 'from-emerald-500 to-teal-500',
  },
];

const POSITIONS = ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'] as const;

const CELEBRATIONS = [
  'Sky Salute 🫡',
  'Too Small 🤏',
  'Crown Me 👑',
  'Ice In My Veins 🥶',
  'Rock The Baby 👶',
  'The Silencer 🤫',
  'Flight 23 Strut 🚶‍♂️',
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  profile,
  onUpdateProfile,
  onOpenStore,
  onNavigateToArena,
}) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'identity' | 'appearance'>('attributes');
  
  // Local identity state
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState<CharacterBio>(profile.bio);
  const [avatar, setAvatar] = useState<AvatarConfig>(profile.avatar);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const attributes = profile.attributes;
  const ovr = calculateOvr(attributes);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upgrade attribute handler
  const handleUpgradeAttribute = (key: keyof PlayerAttributes, amount: number = 1) => {
    const currentVal = attributes[key];
    if (currentVal >= 99) return;

    const targetVal = Math.min(99, currentVal + amount);
    let totalCost = 0;
    for (let v = currentVal; v < targetVal; v++) {
      totalCost += getAttributeUpgradeCost(v);
    }

    if (profile.points < totalCost) {
      onOpenStore();
      showToast(`⚠️ Need ${(totalCost - profile.points).toLocaleString()} more Dunk Points to upgrade!`);
      return;
    }

    const nextPoints = profile.points - totalCost;
    const nextAttributes = {
      ...attributes,
      [key]: targetVal,
    };

    onUpdateProfile({
      points: nextPoints,
      attributes: nextAttributes,
    });

    sound.playJudgeChime();
    sound.playBounce();

    const newOvr = calculateOvr(nextAttributes);
    if (newOvr > ovr) {
      sound.playCrowdCheer();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#38bdf8', '#ffffff'],
      });
      showToast(`🔥 OVR Increased to ${newOvr}! Attributes boosted.`);
    } else {
      showToast(`⚡ ${key} upgraded to ${targetVal}! (-${totalCost.toLocaleString()} PTS)`);
    }
  };

  // Save Identity and Appearance
  const handleSaveCharacterDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || profile.name,
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim() || 'dunker'}`,
      bio,
      avatar,
    });
    sound.playBounce();
    sound.playJudgeChime();
    showToast(`✅ Character profile & appearance updated successfully!`);
  };

  const getTierColor = (rating: number) => {
    if (rating >= 95) return 'from-cyan-400 to-blue-500 text-cyan-300 border-cyan-400/50';
    if (rating >= 85) return 'from-amber-400 to-orange-500 text-amber-300 border-amber-400/50';
    if (rating >= 75) return 'from-purple-400 to-pink-500 text-purple-300 border-purple-400/50';
    return 'from-emerald-400 to-teal-500 text-emerald-300 border-emerald-400/50';
  };

  const getOvrTitle = (score: number) => {
    if (score >= 95) return 'HALL OF FAME GOAT';
    if (score >= 88) return 'SUPERSTAR SKYWALKER';
    if (score >= 80) return 'ELITE SLAM ARTIST';
    if (score >= 70) return 'PRO RIM ROCKER';
    return 'RISING CONTENDER';
  };

  return (
    <div id="character-creator-view" className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 border border-amber-400/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Character Card & Overview Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div 
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: avatar.primaryColor || '#f97316' }}
        />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Left: Avatar Badge & Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="relative group">
              <JerseyAvatar avatar={avatar} size="lg" showGlow animate />
              <div 
                className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-lg text-xs font-black border shadow-lg"
                style={{
                  backgroundColor: avatar.primaryColor,
                  borderColor: avatar.secondaryColor,
                  color: avatar.numberColor,
                }}
              >
                #{avatar.jerseyNumber}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  {bio.position}
                </span>
                <span className="text-neutral-500">•</span>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700 text-[10px] font-black uppercase">
                  {bio.archetype}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black">
                  {profile.rankTitle}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black font-display text-white uppercase tracking-wide">
                {profile.name}
              </h1>

              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-neutral-400 mt-1">
                <span className="font-semibold text-neutral-300">{profile.handle}</span>
                <span>•</span>
                <span>Height: <strong className="text-white">{bio.height}</strong></span>
                <span>•</span>
                <span>Wingspan: <strong className="text-white">{bio.wingspan}</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Overall Rating & Wallet Pouch */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 w-full lg:w-auto">
            
            {/* OVR Rating Badge */}
            <div className="bg-neutral-950/90 border border-neutral-800 p-4 rounded-3xl text-center min-w-[140px] shadow-inner">
              <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                PLAYER RATING
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-display font-black text-4xl sm:text-5xl text-amber-400 tracking-tight">
                  {ovr}
                </span>
                <span className="text-xs font-black text-neutral-500 uppercase">OVR</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mt-1">
                {getOvrTitle(ovr)}
              </span>
            </div>

            {/* Dunk Points Wallet & Store CTA */}
            <div className="bg-neutral-950/90 border border-neutral-800 p-4 rounded-3xl text-center min-w-[170px] shadow-inner flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-neutral-400 block mb-0.5">
                  AVAILABLE POINTS
                </span>
                <span className="font-display font-black text-2xl sm:text-3xl text-amber-400">
                  {profile.points.toLocaleString()} PTS
                </span>
              </div>

              <button
                onClick={onOpenStore}
                className="mt-2 w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Buy Points</span>
              </button>
            </div>

          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-neutral-800/80 pt-4 mt-6">
          <button
            onClick={() => {
              setActiveTab('attributes');
              sound.playBounce();
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'attributes'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Build Attributes (Spend Points)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('identity');
              sound.playBounce();
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'identity'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Character Bio & Archetype</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('appearance');
              sound.playBounce();
            }}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'appearance'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 shadow-md font-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Jersey & Style Customizer</span>
          </button>
        </div>

      </div>

      {/* TAB 1: BUILD ATTRIBUTES WITH POINTS */}
      {activeTab === 'attributes' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Quick Guide Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Attribute Power-Up Station
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Each attribute directly modifies your flight physics, elevation height, meter speed, and judge scoring in the Contest Arena!
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToArena}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-orange-400 font-bold text-xs uppercase tracking-wider border border-neutral-700 transition-all flex items-center gap-2 shrink-0 hover:scale-105"
            >
              <span>Test in Arena</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Attributes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                key: 'verticalLeap' as const,
                title: 'Vertical Leap',
                subtitle: 'Apex Altitude & Elevation Height',
                icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
                rating: attributes.verticalLeap,
                desc: 'Elevates player jumping altitude on court. Higher baseline judge score and higher apex hangtime.',
                gameplayImpact: `+${Math.round((attributes.verticalLeap - 60) * 0.4)} Inches Higher Apex Flight`,
                color: 'from-orange-500 to-amber-500',
              },
              {
                key: 'hangtimeFloat' as const,
                title: 'Hangtime Float',
                subtitle: 'Zero-G In-Air Aerobics',
                icon: <Wind className="w-5 h-5 text-cyan-400" />,
                rating: attributes.hangtimeFloat,
                desc: 'Extends in-air hangtime window and prevents early gravity pull before reaching the rim.',
                gameplayImpact: `+${((attributes.hangtimeFloat - 60) * 0.02).toFixed(2)}s Flight Duration Extended`,
                color: 'from-cyan-500 to-blue-500',
              },
              {
                key: 'takeoffVelocity' as const,
                title: 'Takeoff Velocity',
                subtitle: 'Sprint Velocity & Launch Momentum',
                icon: <Zap className="w-5 h-5 text-amber-400" />,
                rating: attributes.takeoffVelocity,
                desc: 'Increases runway sprint velocity and adds explosive power bonus to your contest multiplier.',
                gameplayImpact: `+${((attributes.takeoffVelocity - 60) * 0.015).toFixed(2)}x Contest Score Multiplier`,
                color: 'from-amber-400 to-orange-500',
              },
              {
                key: 'rimImpactForce' as const,
                title: 'Rim Impact Force',
                subtitle: 'Power Flush & Backboard Violence',
                icon: <Flame className="w-5 h-5 text-red-400" />,
                rating: attributes.rimImpactForce,
                desc: 'Shakes the backboard and rim violently. Triggers arena roars and bonus points from power judges like Shaq.',
                gameplayImpact: `+${Math.round((attributes.rimImpactForce - 60) * 4.5)} LBS Rim Impact Force`,
                color: 'from-red-500 to-pink-500',
              },
              {
                key: 'timingPrecision' as const,
                title: 'Timing Precision',
                subtitle: 'Expanded Green Sweet-Spot Window',
                icon: <Target className="w-5 h-5 text-emerald-400" />,
                rating: attributes.timingPrecision,
                desc: 'Expands the green target sweet-spot on the Elevation and Flush meters, making PERFECT 50s much easier to hit!',
                gameplayImpact: `+${Math.round((attributes.timingPrecision - 60) * 0.75)}% Meter Green Zone Width`,
                color: 'from-emerald-400 to-teal-500',
              },
            ].map((attr) => {
              const cost = getAttributeUpgradeCost(attr.rating);
              const canAfford = profile.points >= cost;
              const isMax = attr.rating >= 99;

              return (
                <div
                  key={attr.key}
                  id={`attribute-card-${attr.key}`}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-neutral-700 transition-colors"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 shadow-inner">
                          {attr.icon}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white leading-tight">
                            {attr.title}
                          </h4>
                          <span className="text-xs text-neutral-400">
                            {attr.subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Numerical Rating */}
                      <div className="text-right">
                        <span className="font-display font-black text-3xl text-amber-400 leading-none">
                          {attr.rating}
                        </span>
                        <span className="text-xs text-neutral-500 block">/ 99</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-3">
                      <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${attr.color} transition-all duration-500`}
                          style={{ width: `${(attr.rating / 99) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 font-semibold">
                        <span>Current Rating: <strong className="text-white">{attr.rating}</strong></span>
                        <span className="text-emerald-400">{attr.gameplayImpact}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed mt-2">
                      {attr.desc}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Upgrade Cost</span>
                      {isMax ? (
                        <span className="font-bold text-emerald-400 uppercase text-xs">MAX RATING</span>
                      ) : (
                        <span className="font-black text-amber-400 font-display text-base">
                          {cost.toLocaleString()} PTS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isMax ? (
                        <button
                          onClick={() => handleUpgradeAttribute(attr.key, 1)}
                          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                            canAfford
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 hover:scale-105 font-black'
                              : 'bg-neutral-800 text-amber-400 border border-neutral-700 hover:bg-neutral-750'
                          }`}
                        >
                          {canAfford ? (
                            <>
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>+1 Level ({cost} PTS)</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                              <span>Need {(cost - profile.points).toLocaleString()} More • Buy</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>MAXED OUT</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 2: CHARACTER BIO & ARCHETYPE */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveCharacterDetails} className="space-y-6 animate-fadeIn">
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-xl font-black font-display text-white uppercase tracking-wide">
              Player Identity & Physical Archetype
            </h3>

            {/* Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Player Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Jordan"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Handle / Nickname
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g. @skywalker"
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                  maxLength={25}
                />
              </div>
            </div>

            {/* Position & Archetype */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Court Position
                </label>
                <select
                  value={bio.position}
                  onChange={(e) => setBio({ ...bio, position: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Signature Celebration
                </label>
                <select
                  value={bio.signatureCelebration}
                  onChange={(e) => setBio({ ...bio, signatureCelebration: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                >
                  {CELEBRATIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Height & Wingspan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Player Height ({bio.height})
                </label>
                <input
                  type="text"
                  value={bio.height}
                  onChange={(e) => setBio({ ...bio, height: e.target.value })}
                  placeholder={'e.g. 6\'6"'}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Wingspan ({bio.wingspan})
                </label>
                <input
                  type="text"
                  value={bio.wingspan}
                  onChange={(e) => setBio({ ...bio, wingspan: e.target.value })}
                  placeholder={'e.g. 7\'0"'}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Archetype Selector Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                Slam Dunk Archetype
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ARCHETYPES.map((arch) => {
                  const isSelected = bio.archetype === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => {
                        setBio({ ...bio, archetype: arch.id });
                        sound.playBounce();
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-neutral-800 border-orange-500 shadow-lg shadow-orange-500/15'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{arch.icon}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500 text-neutral-950 text-[10px] font-black uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-white">{arch.title}</h4>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          {arch.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-neutral-800 text-[10px] font-bold text-amber-400 uppercase">
                        Focus: {arch.primaryStat}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Player Bio</span>
              </button>
            </div>

          </div>

        </form>
      )}

      {/* TAB 3: APPEARANCE & TEAM JERSEY CUSTOMIZER */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black font-display text-white uppercase tracking-wide">
                  Team Jersey & Player Appearance
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pick your franchise team colors, choose jersey number 0–99, style hair, and equip accessories.
                </p>
              </div>

              <button
                onClick={() => {
                  onUpdateProfile({ avatar });
                  sound.playJudgeChime();
                  showToast('👕 Jersey style saved to profile header!');
                }}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Style</span>
              </button>
            </div>

            {/* Team Schemes Carousel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Franchise Color Schemes
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {TEAM_COLOR_SCHEMES.map((scheme) => {
                  const isSelected = avatar.teamColorSchemeId === scheme.id;
                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => {
                        setAvatar((prev) => ({
                          ...prev,
                          teamColorSchemeId: scheme.id,
                          primaryColor: scheme.primaryColor,
                          secondaryColor: scheme.secondaryColor,
                          accentColor: scheme.accentColor,
                          numberColor: scheme.numberColor,
                          headbandColor: scheme.secondaryColor,
                          accessoryColor: scheme.primaryColor,
                        }));
                        sound.playBounce();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-neutral-800 border-orange-500 ring-2 ring-orange-500/40 shadow-lg'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-5 h-5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: scheme.primaryColor }} />
                        <div className="w-5 h-5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: scheme.secondaryColor }} />
                        <div className="w-5 h-5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: scheme.accentColor }} />
                      </div>
                      <div className="text-xs font-bold text-white truncate">{scheme.name}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{scheme.city}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jersey Number & Quick Picks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Jersey Number (0 - 99)
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={avatar.jerseyNumber}
                  onChange={(e) => {
                    const val = Math.min(99, Math.max(0, parseInt(e.target.value) || 0));
                    setAvatar({ ...avatar, jerseyNumber: val });
                  }}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Quick Legendary Numbers
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_JERSEY_NUMBERS.slice(0, 8).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setAvatar({ ...avatar, jerseyNumber: num });
                        sound.playBounce();
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        avatar.jerseyNumber === num
                          ? 'bg-orange-500 text-neutral-950 font-black shadow-md'
                          : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      #{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skin Tone & Hair */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Skin Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAvatar({ ...avatar, playerSkinTone: st.color })}
                      className={`w-9 h-9 rounded-xl border-2 transition-transform hover:scale-110 ${
                        avatar.playerSkinTone === st.color ? 'border-amber-400 scale-110 shadow-md' : 'border-neutral-700'
                      }`}
                      style={{ backgroundColor: st.color }}
                      title={st.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Hair Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_STYLES.map((hs) => (
                    <button
                      key={hs.id}
                      type="button"
                      onClick={() => setAvatar({ ...avatar, hairStyle: hs.id as any })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        avatar.hairStyle === hs.id
                          ? 'bg-orange-500 text-neutral-950 font-black'
                          : 'bg-neutral-950 text-neutral-300 border border-neutral-800'
                      }`}
                    >
                      {hs.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Accessories & Headband */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div>
                  <div className="font-bold text-sm text-white">Championship Headband</div>
                  <div className="text-xs text-neutral-400">Equip team headband across the forehead</div>
                </div>
                <input
                  type="checkbox"
                  checked={avatar.headband}
                  onChange={(e) => setAvatar({ ...avatar, headband: e.target.checked })}
                  className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Court Accessories
                </label>
                <select
                  value={avatar.accessory}
                  onChange={(e) => setAvatar({ ...avatar, accessory: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="none">No Accessory</option>
                  <option value="arm_sleeve">Compression Arm Sleeve</option>
                  <option value="wristband">Terrycloth Wristband</option>
                  <option value="face_mask">Phantom Carbon Face Mask</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateProfile({ avatar });
                  sound.playJudgeChime();
                  showToast('👕 Jersey style saved to profile header!');
                }}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Style to Profile</span>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
