import React, { useState } from 'react';
import { Lock, Unlock, Sparkles, Check, Flame, ShoppingCart, Star, Award, Play, Film } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DunkMove, UserProfile } from '../types';
import { sound } from '../utils/audio';
import { SloMoReplayModal } from './SloMoReplayModal';
import { DEFAULT_AVATAR_CONFIG } from '../data/teamColorSchemes';

interface DunkVaultProps {
  dunks: DunkMove[];
  profile: UserProfile;
  onUnlockDunk: (dunkId: string, cost: number) => void;
  onOpenStore: () => void;
  onSelectForArena: (dunk: DunkMove) => void;
}

export const DunkVault: React.FC<DunkVaultProps> = ({
  dunks,
  profile,
  onUnlockDunk,
  onOpenStore,
  onSelectForArena,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'custom'>('all');
  const [previewingDunkId, setPreviewingDunkId] = useState<string | null>(dunks[0]?.id || null);
  const [modalDunk, setModalDunk] = useState<DunkMove | null>(null);

  const filteredDunks = dunks.filter((dunk) => {
    if (filter === 'unlocked') return dunk.unlocked;
    if (filter === 'locked') return !dunk.unlocked;
    if (filter === 'custom') return dunk.isCustom;
    return true;
  });

  const handleUnlock = (dunk: DunkMove) => {
    if (profile.points < dunk.cost) {
      onOpenStore();
      return;
    }

    onUnlockDunk(dunk.id, dunk.cost);
    sound.playRimSlam();
    sound.playCrowdCheer();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: [dunk.auraColor || '#f97316', '#ffffff', '#eab308']
    });
  };

  const previewDunk = dunks.find((d) => d.id === previewingDunkId) || dunks[0];

  return (
    <div id="dunk-vault" className="space-y-6">
      
      {/* Vault Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Arsenal & Signature Moves
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black border border-orange-500/30">
              {profile.unlockedDunkIds.length} / {dunks.length} UNLOCKED
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wide text-white">
            The Signature Dunk Vault
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
            Win slam dunk competitions or purchase points to unlock legendary flight mechanics, higher score multipliers, and extreme judge ratings!
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 text-center flex-1 md:flex-none">
            <span className="text-[10px] text-neutral-400 uppercase font-bold block">Available Balance</span>
            <span className="text-xl font-black font-display text-amber-400">
              {profile.points.toLocaleString()} PTS
            </span>
          </div>

          <button
            id="vault-buy-points-btn"
            onClick={onOpenStore}
            className="px-5 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-neutral-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4 text-neutral-950" />
            <span>Buy Points</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        {[
          { id: 'all', label: `All Moves (${dunks.length})` },
          { id: 'unlocked', label: `In Arsenal (${profile.unlockedDunkIds.length})` },
          { id: 'locked', label: 'Locked Moves' },
          { id: 'custom', label: 'Custom Dunk Lab Creations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filter === tab.id
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dunks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDunks.map((dunk) => {
          const isUnlocked = dunk.unlocked;
          const canAfford = profile.points >= dunk.cost;
          const isPreviewing = previewingDunkId === dunk.id;

          return (
            <div
              key={dunk.id}
              id={`vault-card-${dunk.id}`}
              onClick={() => {
                setPreviewingDunkId(dunk.id);
                sound.playBounce();
              }}
              className={`relative p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer ${
                isPreviewing
                  ? 'bg-neutral-850 border-orange-500 shadow-xl shadow-orange-500/10'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      dunk.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      dunk.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      dunk.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      dunk.difficulty === 'Extreme' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {dunk.difficulty}
                    </span>

                    <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                      {dunk.scoreMultiplier}x Hype
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> {dunk.cost.toLocaleString()} PTS
                    </span>
                  )}
                </div>

                {/* Move Title & Nickname */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-wide">
                    {dunk.name}
                  </h3>
                  <div className="text-xs text-orange-400 font-semibold italic">
                    "{dunk.nickname}"
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2">
                    {dunk.description}
                  </p>
                </div>

                {/* Specs Box */}
                <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 my-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Takeoff:</span>
                    <span className="text-neutral-200 font-semibold">{dunk.takeoff}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>In-Air Motion:</span>
                    <span className="text-neutral-200 font-semibold">{dunk.inAirMotion}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Finish:</span>
                    <span className="text-neutral-200 font-semibold">{dunk.finishStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Hangtime Window:</span>
                    <span className="text-amber-400 font-bold">{dunk.hangtimeRequired} Seconds</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalDunk(dunk);
                    sound.playSlowMoWhoosh();
                  }}
                  className="w-full py-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 font-bold text-xs border border-neutral-800 hover:border-amber-400/40 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Preview mechanics in 0.25x Slow-Mo Replay Theatre"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Slow-Mo Preview (0.25x)</span>
                </button>

                {isUnlocked ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectForArena(dunk);
                      sound.playBounce();
                    }}
                    className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span>Equip & Dunk in Arena</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlock(dunk);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                      canAfford
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 hover:scale-[1.02]'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-amber-400 border border-neutral-700'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-neutral-950" />
                        <span>Unlock for {dunk.cost.toLocaleString()} PTS</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                        <span>Need {(dunk.cost - profile.points).toLocaleString()} More PTS • Buy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Slow-Mo Preview Theatre Modal */}
      {modalDunk && (
        <SloMoReplayModal
          isOpen={!!modalDunk}
          onClose={() => setModalDunk(null)}
          dunk={modalDunk}
          avatar={profile.avatar || DEFAULT_AVATAR_CONFIG}
          playerName={profile.name}
          score={modalDunk.difficulty === 'Legendary' ? 50 : 48}
          timingAccuracy="PERFECT"
        />
      )}

    </div>
  );
};
