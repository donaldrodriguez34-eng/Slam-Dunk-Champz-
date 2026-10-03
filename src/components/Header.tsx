import React from 'react';
import { Trophy, Flame, Sparkles, Video, Lock, Hammer, ShoppingCart, Volume2, VolumeX, Shirt, Palette, Dumbbell, User } from 'lucide-react';
import { ViewMode, UserProfile } from '../types';
import { sound } from '../utils/audio';
import { JerseyAvatar } from './JerseyAvatar';
import { TEAM_COLOR_SCHEMES, DEFAULT_AVATAR_CONFIG } from '../data/teamColorSchemes';
import { calculateOvr } from './CharacterCreator';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  profile: UserProfile;
  onOpenStore: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAvatarEditor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  profile,
  onOpenStore,
  soundEnabled,
  onToggleSound,
  onOpenAvatarEditor,
}) => {
  const currentAvatar = profile.avatar || DEFAULT_AVATAR_CONFIG;
  const activeScheme = TEAM_COLOR_SCHEMES.find(
    (s) => s.id === currentAvatar.teamColorSchemeId
  ) || {
    id: 'custom',
    name: 'Custom Colors',
    city: 'Custom',
    primaryColor: currentAvatar.primaryColor,
    secondaryColor: currentAvatar.secondaryColor,
    accentColor: currentAvatar.accentColor,
    textColor: '#FFFFFF',
    numberColor: currentAvatar.numberColor,
  };
  return (
    <header id="app-header" className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div 
            id="brand-logo"
            onClick={() => onSelectView('arena')}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25 border border-orange-400/40 group-hover:scale-105 transition-transform duration-200">
              <span className="text-xl sm:text-2xl transform -rotate-12">🏀</span>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-white uppercase italic">
                  SLAM DUNK
                </span>
                <span className="font-display font-black text-xl sm:text-2xl tracking-wider text-orange-500 uppercase italic">
                  CHAMPIONSHIP
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                <span className="text-orange-400 flex items-center gap-0.5">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                  {profile.rankTitle}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400">{profile.contestsWon} Contest Wins</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav id="main-navigation" className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800/80">
            <button
              id="nav-arena-btn"
              onClick={() => {
                sound.playBounce();
                onSelectView('arena');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentView === 'arena'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Contest Arena</span>
            </button>

            <button
              id="nav-highlights-btn"
              onClick={() => {
                sound.playBounce();
                onSelectView('highlights');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentView === 'highlights'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Highlights Reel</span>
            </button>

            <button
              id="nav-vault-btn"
              onClick={() => {
                sound.playBounce();
                onSelectView('vault');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentView === 'vault'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Dunk Vault</span>
            </button>

            <button
              id="nav-creator-btn"
              onClick={() => {
                sound.playBounce();
                onSelectView('creator');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentView === 'creator'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>Dunk Lab</span>
              {(profile.totalPointsEarned >= 5000 || profile.points >= 5000) && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold border border-emerald-500/40">
                  UNLOCKED
                </span>
              )}
            </button>

            <button
              id="nav-character-btn"
              onClick={() => {
                sound.playBounce();
                onSelectView('character');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                currentView === 'character'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Dumbbell className="w-4 h-4 text-amber-400" />
              <span>Player HQ</span>
              {profile.attributes && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-black border border-amber-500/40">
                  {calculateOvr(profile.attributes)} OVR
                </span>
              )}
            </button>
          </nav>

          {/* Actions & Balance */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Profile Header Avatar Widget */}
            <div 
              id="profile-header-avatar-btn"
              onClick={() => {
                sound.playBounce();
                onOpenAvatarEditor();
              }}
              className="group flex items-center gap-2 sm:gap-2.5 bg-neutral-900/90 hover:bg-neutral-850 p-1.5 pr-2.5 sm:pr-3 rounded-2xl border transition-all cursor-pointer shadow-sm duration-200 select-none"
              style={{
                borderColor: `${currentAvatar.primaryColor}55`,
                boxShadow: `0 0 14px ${currentAvatar.primaryColor}15`,
              }}
              title="Click to customize team color scheme and jersey number"
            >
              <div className="relative">
                <JerseyAvatar avatar={currentAvatar} size="sm" showGlow />
                <span 
                  className="absolute -bottom-1 -right-1 px-1 rounded text-[9px] font-black leading-none py-0.5 border shadow-xs"
                  style={{
                    backgroundColor: currentAvatar.primaryColor,
                    borderColor: currentAvatar.secondaryColor,
                    color: currentAvatar.numberColor,
                  }}
                >
                  #{currentAvatar.jerseyNumber}
                </span>
              </div>

              <div className="hidden sm:flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[85px] md:max-w-[110px]">
                    {profile.name}
                  </span>
                  <span className="px-1 py-0.2 bg-neutral-800 text-[9px] font-bold text-neutral-300 group-hover:text-orange-400 group-hover:border-orange-500/40 border border-neutral-700 rounded transition-colors flex items-center gap-0.5">
                    <Shirt className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 truncate">
                  <span 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: currentAvatar.primaryColor }}
                  />
                  <span className="truncate max-w-[95px] md:max-w-[125px]">
                    {activeScheme.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Mute audio" : "Enable audio"}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title={soundEnabled ? "Sound Effects Enabled" : "Sound Muted"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Points Wallet Pill + Buy Points CTA */}
            <div 
              id="points-wallet-pill"
              onClick={onOpenStore}
              className="group flex items-center gap-2 sm:gap-2.5 bg-neutral-900/90 hover:bg-neutral-850 p-1.5 pr-2.5 sm:pr-3 rounded-2xl border border-neutral-700/80 hover:border-orange-500/50 cursor-pointer transition-all shadow-sm duration-200"
              title="Click to buy points"
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-neutral-950 font-black text-xs sm:text-sm shadow-sm shadow-amber-500/30">
                <Sparkles className="w-4 h-4 text-neutral-950 fill-neutral-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider leading-none">
                  Dunk Points
                </span>
                <span className="font-display font-black text-sm sm:text-base text-amber-400 leading-tight">
                  {profile.points.toLocaleString()} PTS
                </span>
              </div>
              <button 
                id="buy-points-header-btn"
                className="ml-1 px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 group-hover:bg-orange-500 group-hover:text-white transition-all flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                <span>+ Buy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-800/80 gap-1 text-xs">
          <button
            id="mobile-nav-arena"
            onClick={() => onSelectView('arena')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              currentView === 'arena' ? 'text-orange-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <Trophy className="w-4 h-4 mb-0.5" />
            <span>Contest</span>
          </button>
          <button
            id="mobile-nav-highlights"
            onClick={() => onSelectView('highlights')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              currentView === 'highlights' ? 'text-orange-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <Video className="w-4 h-4 mb-0.5" />
            <span>Highlights</span>
          </button>
          <button
            id="mobile-nav-vault"
            onClick={() => onSelectView('vault')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              currentView === 'vault' ? 'text-orange-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <Lock className="w-4 h-4 mb-0.5" />
            <span>Vault</span>
          </button>
          <button
            id="mobile-nav-creator"
            onClick={() => onSelectView('creator')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              currentView === 'creator' ? 'text-orange-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <Hammer className="w-4 h-4 mb-0.5" />
            <span>Dunk Lab</span>
          </button>
          <button
            id="mobile-nav-character"
            onClick={() => {
              sound.playBounce();
              onSelectView('character');
            }}
            className={`flex flex-col items-center py-1 px-2 rounded-lg ${
              currentView === 'character' ? 'text-orange-400 font-bold' : 'text-neutral-400'
            }`}
          >
            <Dumbbell className="w-4 h-4 mb-0.5" />
            <span>Player HQ</span>
          </button>
          <button
            id="mobile-nav-avatar"
            onClick={() => {
              sound.playBounce();
              onOpenAvatarEditor();
            }}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-neutral-400 hover:text-orange-400"
          >
            <div className="relative">
              <Shirt className="w-4 h-4 mb-0.5 text-neutral-300" />
              <span 
                className="absolute -top-1 -right-2 text-[8px] font-black px-1 rounded leading-none py-0.2"
                style={{
                  backgroundColor: currentAvatar.primaryColor,
                  color: currentAvatar.numberColor,
                }}
              >
                #{currentAvatar.jerseyNumber}
              </span>
            </div>
            <span>Jersey</span>
          </button>
        </div>

      </div>
    </header>
  );
};
