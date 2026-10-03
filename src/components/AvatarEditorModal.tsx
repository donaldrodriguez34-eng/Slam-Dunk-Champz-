import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Shuffle, RotateCcw, Palette, Hash, Shirt, User, ChevronRight } from 'lucide-react';
import { AvatarConfig, TeamColorScheme } from '../types';
import { TEAM_COLOR_SCHEMES, QUICK_JERSEY_NUMBERS, SKIN_TONES, HAIR_STYLES } from '../data/teamColorSchemes';
import { JerseyAvatar } from './JerseyAvatar';
import { sound } from '../utils/audio';

interface AvatarEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: AvatarConfig;
  onSaveAvatar: (newAvatar: AvatarConfig) => void;
  playerName: string;
  playerHandle: string;
  rankTitle: string;
}

type TabType = 'team' | 'number' | 'style' | 'baller';

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSaveAvatar,
  playerName,
  playerHandle,
  rankTitle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [avatar, setAvatar] = useState<AvatarConfig>(currentAvatar);
  const [isCustomColors, setIsCustomColors] = useState(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setAvatar(currentAvatar);
      setIsCustomColors(currentAvatar.teamColorSchemeId === 'custom');
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  // Selected Team Scheme
  const selectedScheme = TEAM_COLOR_SCHEMES.find((s) => s.id === avatar.teamColorSchemeId) || {
    id: 'custom',
    name: 'Custom Franchise',
    city: 'Custom City',
    primaryColor: avatar.primaryColor,
    secondaryColor: avatar.secondaryColor,
    accentColor: avatar.accentColor,
    textColor: '#FFFFFF',
    numberColor: avatar.numberColor,
    pattern: avatar.jerseyStyle,
  };

  // Handlers
  const handleSelectScheme = (scheme: TeamColorScheme) => {
    sound.playBounce();
    setAvatar((prev) => ({
      ...prev,
      teamColorSchemeId: scheme.id,
      primaryColor: scheme.primaryColor,
      secondaryColor: scheme.secondaryColor,
      accentColor: scheme.accentColor,
      numberColor: scheme.numberColor,
      jerseyStyle: scheme.pattern === 'gradient' ? 'modern' : (scheme.pattern || 'classic'),
      headbandColor: scheme.secondaryColor,
      accessoryColor: scheme.primaryColor,
    }));
  };

  const handleNumberChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    if (cleaned === '') {
      setAvatar((prev) => ({ ...prev, jerseyNumber: 0 }));
      return;
    }
    const val = Math.min(99, Math.max(0, parseInt(cleaned, 10)));
    setAvatar((prev) => ({ ...prev, jerseyNumber: val }));
  };

  const handleQuickNumber = (num: number) => {
    sound.playBounce();
    setAvatar((prev) => ({ ...prev, jerseyNumber: num }));
  };

  const handleRandomize = () => {
    sound.playBounce();
    const randomScheme = TEAM_COLOR_SCHEMES[Math.floor(Math.random() * TEAM_COLOR_SCHEMES.length)];
    const randomNum = QUICK_JERSEY_NUMBERS[Math.floor(Math.random() * QUICK_JERSEY_NUMBERS.length)];
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].color;
    const randomHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id as AvatarConfig['hairStyle'];
    const randomPattern = (['classic', 'modern', 'pinstripe', 'split'] as const)[Math.floor(Math.random() * 4)];
    const randomAccessory = (['none', 'arm_sleeve', 'wristband', 'face_mask'] as const)[Math.floor(Math.random() * 4)];

    setAvatar({
      teamColorSchemeId: randomScheme.id,
      primaryColor: randomScheme.primaryColor,
      secondaryColor: randomScheme.secondaryColor,
      accentColor: randomScheme.accentColor,
      numberColor: randomScheme.numberColor,
      jerseyNumber: randomNum,
      jerseyStyle: randomPattern,
      playerSkinTone: randomSkin,
      headband: Math.random() > 0.3,
      headbandColor: randomScheme.secondaryColor,
      hairStyle: randomHair,
      accessory: randomAccessory,
      accessoryColor: randomScheme.primaryColor,
    });
  };

  const handleReset = () => {
    sound.playBounce();
    setAvatar(currentAvatar);
  };

  const handleSave = () => {
    sound.playJudgeChime();
    onSaveAvatar(avatar);
    onClose();
  };

  return (
    <div
      id="avatar-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-neutral-800 bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white uppercase tracking-wide">
                Player Avatar & Jersey Studio
              </h2>
              <p className="text-xs text-neutral-400">
                Customize your team colors and iconic jersey number for your profile header
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="avatar-randomize-btn"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700/60 transition-colors"
              title="Shuffle avatar style"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Randomize</span>
            </button>

            <button
              id="avatar-reset-btn"
              onClick={handleReset}
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/60 transition-colors"
              title="Reset to current avatar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="avatar-editor-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Screen */}
        <div className="flex flex-col lg:flex-row overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
          
          {/* LEFT SIDE: Live Avatar & Profile Showcase */}
          <div className="lg:w-80 xl:w-96 p-6 flex flex-col items-center justify-between bg-neutral-950/40 shrink-0 gap-6">
            
            <div className="w-full flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Live Avatar Preview
              </span>

              {/* Large Avatar Stage */}
              <div className="relative p-5 rounded-3xl bg-gradient-to-b from-neutral-800/60 to-neutral-900/90 border border-neutral-700/70 shadow-2xl flex flex-col items-center w-full max-w-[260px]">
                <JerseyAvatar
                  avatar={avatar}
                  size="hero"
                  showGlow
                  animate
                />

                {/* Big Jersey Number Badge */}
                <div 
                  className="mt-4 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border"
                  style={{
                    backgroundColor: avatar.primaryColor,
                    borderColor: avatar.secondaryColor,
                    color: avatar.numberColor,
                  }}
                >
                  <span>JERSEY #{avatar.jerseyNumber}</span>
                </div>
              </div>

              {/* Header Preview Simulation Card */}
              <div className="mt-5 w-full bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block mb-2">
                  App Header Profile Preview:
                </span>
                <div className="flex items-center gap-3 p-2 bg-neutral-950 rounded-xl border border-neutral-800/80">
                  <JerseyAvatar avatar={avatar} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{playerName}</span>
                      <span 
                        className="px-1.5 py-0.2 text-[10px] font-black rounded-md shrink-0"
                        style={{
                          backgroundColor: `${avatar.primaryColor}30`,
                          color: avatar.numberColor === '#000000' ? avatar.primaryColor : avatar.numberColor,
                          border: `1px solid ${avatar.secondaryColor}60`,
                        }}
                      >
                        #{avatar.jerseyNumber}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-1 truncate">
                      <span style={{ color: avatar.primaryColor }}>●</span>
                      <span className="truncate">{selectedScheme.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheme Colors Quick Strip */}
            <div className="w-full bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-[11px] font-medium">Palette:</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: avatar.primaryColor }}
                    title={`Primary: ${avatar.primaryColor}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: avatar.secondaryColor }}
                    title={`Secondary: ${avatar.secondaryColor}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: avatar.accentColor }}
                    title={`Accent: ${avatar.accentColor}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: avatar.numberColor, color: avatar.primaryColor }}
                    title={`Number Color: ${avatar.numberColor}`}
                  >
                    #
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-orange-400 font-bold">
                {selectedScheme.city}
              </span>
            </div>

          </div>

          {/* RIGHT SIDE: Customization Controls */}
          <div className="flex-1 flex flex-col p-5 sm:p-7 overflow-y-auto">
            
            {/* Customizer Sub-Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950/80 rounded-2xl border border-neutral-800 mb-6 shrink-0">
              <button
                id="tab-team-scheme"
                onClick={() => {
                  sound.playBounce();
                  setActiveTab('team');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'team'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Palette className="w-4 h-4 text-orange-400" />
                <span>Team Scheme</span>
              </button>

              <button
                id="tab-jersey-number"
                onClick={() => {
                  sound.playBounce();
                  setActiveTab('number');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'number'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Hash className="w-4 h-4 text-amber-400" />
                <span>Jersey #{avatar.jerseyNumber}</span>
              </button>

              <button
                id="tab-jersey-style"
                onClick={() => {
                  sound.playBounce();
                  setActiveTab('style');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'style'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Shirt className="w-4 h-4 text-purple-400" />
                <span>Jersey Cut</span>
              </button>

              <button
                id="tab-baller-appearance"
                onClick={() => {
                  sound.playBounce();
                  setActiveTab('baller');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === 'baller'
                    ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Player Gear</span>
              </button>
            </div>

            {/* TAB CONTENT 1: Team Color Scheme */}
            {activeTab === 'team' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Select Team Color Scheme
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Choose an iconic basketball franchise palette or customize your own
                    </p>
                  </div>

                  <button
                    id="toggle-custom-colors-btn"
                    onClick={() => {
                      sound.playBounce();
                      setIsCustomColors(!isCustomColors);
                      if (!isCustomColors) {
                        setAvatar((prev) => ({ ...prev, teamColorSchemeId: 'custom' }));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      isCustomColors
                        ? 'bg-orange-500 text-neutral-950 border-orange-400'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{isCustomColors ? 'Customizing Colors' : 'Custom Palette'}</span>
                  </button>
                </div>

                {/* Preset Scheme Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {TEAM_COLOR_SCHEMES.map((scheme) => {
                    const isSelected = avatar.teamColorSchemeId === scheme.id && !isCustomColors;
                    return (
                      <button
                        key={scheme.id}
                        id={`scheme-btn-${scheme.id}`}
                        onClick={() => {
                          setIsCustomColors(false);
                          handleSelectScheme(scheme);
                        }}
                        className={`group p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-neutral-800 border-orange-500 ring-2 ring-orange-500/30 shadow-md'
                            : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-orange-500 text-neutral-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                            {scheme.city}
                          </span>
                          <h4 className="text-xs font-black text-white leading-snug">
                            {scheme.name}
                          </h4>
                        </div>

                        {/* Swatch bars */}
                        <div className="mt-3 flex items-center gap-1.5">
                          <div
                            className="h-3 w-8 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: scheme.primaryColor }}
                            title="Primary"
                          />
                          <div
                            className="h-3 w-5 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: scheme.secondaryColor }}
                            title="Secondary"
                          />
                          <div
                            className="h-3 w-3 rounded-full border border-white/20 shadow-xs"
                            style={{ backgroundColor: scheme.accentColor }}
                            title="Accent"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Pickers Accordion */}
                {isCustomColors && (
                  <div className="p-4 rounded-2xl bg-neutral-950/90 border border-orange-500/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Custom Palette Editor
                      </span>
                      <span className="text-[11px] text-neutral-400">Live Updating</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Primary Color */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 block">Primary Body</label>
                        <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                          <input
                            id="custom-primary-color"
                            type="color"
                            value={avatar.primaryColor}
                            onChange={(e) => {
                              setAvatar((prev) => ({ ...prev, primaryColor: e.target.value, teamColorSchemeId: 'custom' }));
                            }}
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-xs font-mono text-neutral-300 uppercase">{avatar.primaryColor}</span>
                        </div>
                      </div>

                      {/* Secondary Trim */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 block">Trim & Panels</label>
                        <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                          <input
                            id="custom-secondary-color"
                            type="color"
                            value={avatar.secondaryColor}
                            onChange={(e) => {
                              setAvatar((prev) => ({ ...prev, secondaryColor: e.target.value, teamColorSchemeId: 'custom' }));
                            }}
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-xs font-mono text-neutral-300 uppercase">{avatar.secondaryColor}</span>
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 block">Accent Stitch</label>
                        <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                          <input
                            id="custom-accent-color"
                            type="color"
                            value={avatar.accentColor}
                            onChange={(e) => {
                              setAvatar((prev) => ({ ...prev, accentColor: e.target.value, teamColorSchemeId: 'custom' }));
                            }}
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-xs font-mono text-neutral-300 uppercase">{avatar.accentColor}</span>
                        </div>
                      </div>

                      {/* Number Color */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-300 block">Number Digits</label>
                        <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                          <input
                            id="custom-number-color"
                            type="color"
                            value={avatar.numberColor}
                            onChange={(e) => {
                              setAvatar((prev) => ({ ...prev, numberColor: e.target.value, teamColorSchemeId: 'custom' }));
                            }}
                            className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                          />
                          <span className="text-xs font-mono text-neutral-300 uppercase">{avatar.numberColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Jersey Number */}
            {activeTab === 'number' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Select Your Jersey Number
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Pick your signature digits (0–99). This appears across the arena, your highlights, and profile header.
                  </p>
                </div>

                {/* Main Number Control */}
                <div className="p-6 rounded-3xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                      Current Number (0 - 99)
                    </label>
                    <div className="text-xs text-neutral-500">
                      Type directly or use the quick selectors below
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      id="decrement-number-btn"
                      onClick={() => {
                        sound.playBounce();
                        setAvatar((prev) => ({
                          ...prev,
                          jerseyNumber: prev.jerseyNumber <= 0 ? 99 : prev.jerseyNumber - 1,
                        }));
                      }}
                      className="w-11 h-11 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xl font-black text-white flex items-center justify-center transition-colors"
                    >
                      −
                    </button>

                    <div className="relative">
                      <input
                        id="jersey-number-input"
                        type="text"
                        maxLength={2}
                        value={avatar.jerseyNumber}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        className="w-24 h-16 text-center text-3xl font-black font-display bg-neutral-900 border-2 border-orange-500 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-orange-500/30"
                      />
                      <span className="absolute top-1 left-2 text-[9px] font-bold text-neutral-500">NO.</span>
                    </div>

                    <button
                      id="increment-number-btn"
                      onClick={() => {
                        sound.playBounce();
                        setAvatar((prev) => ({
                          ...prev,
                          jerseyNumber: prev.jerseyNumber >= 99 ? 0 : prev.jerseyNumber + 1,
                        }));
                      }}
                      className="w-11 h-11 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xl font-black text-white flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Iconic Hall-of-Fame Numbers */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                    <span>🔥 Iconic Hall of Fame Numbers:</span>
                  </h4>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {QUICK_JERSEY_NUMBERS.map((num) => {
                      const isSelected = avatar.jerseyNumber === num;
                      return (
                        <button
                          key={num}
                          id={`quick-num-${num}`}
                          onClick={() => handleQuickNumber(num)}
                          className={`py-2.5 rounded-xl font-display font-black text-base sm:text-lg border transition-all ${
                            isSelected
                              ? 'bg-orange-500 text-neutral-950 border-orange-400 shadow-md scale-105'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          #{num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Jersey Cut & Pattern */}
            {activeTab === 'style' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Jersey Pattern & Cut
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Select how the team panels, stripes, and accents wrap your uniform
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { id: 'classic', label: 'Classic Pro Trim', desc: 'Contrasting side panels with accent border piping' },
                    { id: 'modern', label: 'Modern Slash', desc: 'Dynamic angular slash across the torso' },
                    { id: 'pinstripe', label: 'Retro Pinstripes', desc: 'Iconic vertical needle stripes inspired by 90s ballers' },
                    { id: 'split', label: 'Dual-Tone Split', desc: 'Bold half-and-half color block aesthetic' },
                  ].map((style) => {
                    const isSelected = avatar.jerseyStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        id={`jersey-cut-${style.id}`}
                        onClick={() => {
                          sound.playBounce();
                          setAvatar((prev) => ({ ...prev, jerseyStyle: style.id as AvatarConfig['jerseyStyle'] }));
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-neutral-800 border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                            : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white">{style.label}</h4>
                          {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                        </div>
                        <p className="text-xs text-neutral-400">{style.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Baller Appearance & Gear */}
            {activeTab === 'baller' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Player Gear & Appearance
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Personalize your baller skin tone, hairstyle, and on-court accessories
                  </p>
                </div>

                {/* Skin Tone */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
                    Skin Tone
                  </label>
                  <div className="flex items-center gap-3">
                    {SKIN_TONES.map((tone) => {
                      const isSelected = avatar.playerSkinTone === tone.color;
                      return (
                        <button
                          key={tone.id}
                          id={`skin-tone-${tone.id}`}
                          onClick={() => {
                            sound.playBounce();
                            setAvatar((prev) => ({ ...prev, playerSkinTone: tone.color }));
                          }}
                          className={`w-9 h-9 rounded-2xl border-2 transition-all flex items-center justify-center ${
                            isSelected ? 'border-orange-500 ring-2 ring-orange-500/40 scale-110' : 'border-neutral-700 hover:border-neutral-500'
                          }`}
                          style={{ backgroundColor: tone.color }}
                          title={tone.label}
                        >
                          {isSelected && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hair Style */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
                    Hairstyle
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {HAIR_STYLES.map((hair) => {
                      const isSelected = avatar.hairStyle === hair.id;
                      return (
                        <button
                          key={hair.id}
                          id={`hair-style-${hair.id}`}
                          onClick={() => {
                            sound.playBounce();
                            setAvatar((prev) => ({ ...prev, hairStyle: hair.id as AvatarConfig['hairStyle'] }));
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-neutral-800 border-orange-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {hair.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Headband & Color */}
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      Signature Headband
                    </div>
                    <div className="text-xs text-neutral-400">
                      Classic athletic headband worn across the forehead
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      id="headband-toggle-btn"
                      onClick={() => {
                        sound.playBounce();
                        setAvatar((prev) => ({ ...prev, headband: !prev.headband }));
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        avatar.headband
                          ? 'bg-orange-500 text-neutral-950 border-orange-400'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      {avatar.headband ? 'Equipped' : 'None'}
                    </button>

                    {avatar.headband && (
                      <div className="flex items-center gap-1.5">
                        {[
                          { color: '#000000', label: 'Black' },
                          { color: '#FFFFFF', label: 'White' },
                          { color: avatar.secondaryColor, label: 'Team Secondary' },
                          { color: avatar.primaryColor, label: 'Team Primary' },
                        ].map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setAvatar((prev) => ({ ...prev, headbandColor: c.color }))}
                            className={`w-6 h-6 rounded-full border ${avatar.headbandColor === c.color ? 'ring-2 ring-orange-500' : 'border-neutral-700'}`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessories */}
                <div>
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block mb-2.5">
                    Arm & Face Accessories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'arm_sleeve', label: 'Shooter Sleeve' },
                      { id: 'wristband', label: 'Wristband' },
                      { id: 'face_mask', label: 'Clear Mask' },
                    ].map((item) => {
                      const isSelected = avatar.accessory === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`accessory-${item.id}`}
                          onClick={() => {
                            sound.playBounce();
                            setAvatar((prev) => ({ ...prev, accessory: item.id as AvatarConfig['accessory'] }));
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-neutral-800 border-orange-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready to update profile header with <strong>{selectedScheme.name}</strong> • #{avatar.jerseyNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="avatar-cancel-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-700 transition-colors"
            >
              Cancel
            </button>

            <button
              id="avatar-save-btn"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-neutral-950 text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save & Update Profile</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
