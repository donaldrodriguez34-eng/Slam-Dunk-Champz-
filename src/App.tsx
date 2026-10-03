import React, { useState, useEffect } from 'react';
import { ViewMode, DunkMove, HighlightVideo, UserProfile, AvatarConfig, PlayerAttributes, CharacterBio } from './types';
import { INITIAL_DUNKS } from './data/initialDunks';
import { INITIAL_HIGHLIGHTS } from './data/mockHighlights';
import { DEFAULT_AVATAR_CONFIG } from './data/teamColorSchemes';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { ContestArena } from './components/ContestArena';
import { HighlightsFeed } from './components/HighlightsFeed';
import { DunkVault } from './components/DunkVault';
import { DunkArchitect } from './components/DunkArchitect';
import { CharacterCreator } from './components/CharacterCreator';
import { PointStoreModal } from './components/PointStoreModal';
import { HighlightRecorder } from './components/HighlightRecorder';
import { AvatarEditorModal } from './components/AvatarEditorModal';

const STORAGE_KEYS = {
  PROFILE: 'slamdunk_user_profile_v1',
  DUNKS: 'slamdunk_moves_v1',
  HIGHLIGHTS: 'slamdunk_highlights_v1',
};

export const DEFAULT_ATTRIBUTES: PlayerAttributes = {
  verticalLeap: 70,
  hangtimeFloat: 68,
  takeoffVelocity: 72,
  rimImpactForce: 67,
  timingPrecision: 71,
};

export const DEFAULT_BIO: CharacterBio = {
  position: 'Small Forward',
  archetype: 'Slashing Skywalker',
  height: `6'6"`,
  wingspan: `7'0"`,
  signatureCelebration: 'Sky Salute',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Marcus "Sky" Jordan',
  handle: '@skywalker',
  points: 450,
  totalPointsEarned: 750,
  contestsWon: 3,
  contestsPlayed: 4,
  rankTitle: 'Rising Skywalker',
  highestScore: 49,
  unlockedDunkIds: ['dunk-tomahawk', 'dunk-backscratcher'],
  customDunksCreated: 0,
  avatar: DEFAULT_AVATAR_CONFIG,
  attributes: DEFAULT_ATTRIBUTES,
  bio: DEFAULT_BIO,
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('arena');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Modals
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          avatar: parsed.avatar || DEFAULT_AVATAR_CONFIG,
          attributes: { ...DEFAULT_ATTRIBUTES, ...(parsed.attributes || {}) },
          bio: { ...DEFAULT_BIO, ...(parsed.bio || {}) },
        };
      }
    } catch (e) {
      console.warn('Could not load profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  });

  // Dunks Catalog State
  const [dunks, setDunks] = useState<DunkMove[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DUNKS);
      if (saved) {
        const parsed: DunkMove[] = JSON.parse(saved);
        // Normalize locked dunks to 500 points cost as required
        return parsed.map((d) => {
          if (!d.isCustom && d.cost > 0) {
            return { ...d, cost: 500 };
          }
          return d;
        });
      }
    } catch (e) {
      console.warn('Could not load dunks from localStorage', e);
    }
    return INITIAL_DUNKS;
  });

  // Highlights State
  const [highlights, setHighlights] = useState<HighlightVideo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGHLIGHTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load highlights from localStorage', e);
    }
    return INITIAL_HIGHLIGHTS;
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {}
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DUNKS, JSON.stringify(dunks));
    } catch (e) {}
  }, [dunks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(highlights));
    } catch (e) {}
  }, [highlights]);

  // Compute unlocked dunks
  const unlockedDunks = dunks.filter((dunk) => 
    profile.unlockedDunkIds.includes(dunk.id) || dunk.unlocked || dunk.isCustom
  );

  const customDunks = dunks.filter((dunk) => dunk.isCustom);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playBounce();
  };

  // 1. Win contest & earn points
  const handleWinContest = (pointsEarned: number) => {
    setProfile((prev) => {
      const nextPoints = prev.points + pointsEarned;
      const nextTotal = prev.totalPointsEarned + pointsEarned;
      const nextWins = prev.contestsWon + 1;
      const nextPlayed = prev.contestsPlayed + 1;

      // Update rank dynamically
      let nextRank = prev.rankTitle;
      if (nextTotal >= 3500) nextRank = 'Hall of Fame Legend';
      else if (nextTotal >= 2000) nextRank = 'Slam King';
      else if (nextTotal >= 1000) nextRank = 'Skywalker Elite';
      else if (nextTotal >= 500) nextRank = 'Rim Rocker';

      return {
        ...prev,
        points: nextPoints,
        totalPointsEarned: nextTotal,
        contestsWon: nextWins,
        contestsPlayed: nextPlayed,
        rankTitle: nextRank,
      };
    });

    showToast(`🏆 Contest Won! +${pointsEarned.toLocaleString()} Dunk Points Earned!`);
  };

  // 2. Buy points from store
  const handlePurchasePoints = (pointsAdded: number) => {
    setProfile((prev) => ({
      ...prev,
      points: prev.points + pointsAdded,
      totalPointsEarned: prev.totalPointsEarned + pointsAdded,
    }));
    showToast(`💰 Payment Complete! +${pointsAdded.toLocaleString()} Points Credited!`);
  };

  // 3. Unlock a locked dunk using points
  const handleUnlockDunk = (dunkId: string, cost: number) => {
    if (profile.points < cost) {
      setIsStoreOpen(true);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      points: prev.points - cost,
      unlockedDunkIds: [...prev.unlockedDunkIds, dunkId],
    }));

    setDunks((prev) =>
      prev.map((d) => (d.id === dunkId ? { ...d, unlocked: true } : d))
    );

    const targetDunk = dunks.find((d) => d.id === dunkId);
    showToast(`⚡ Unlocked: ${targetDunk?.name || 'New Move'}! Ready for competition.`);
  };

  // 4. Save and share custom created dunk in Dunk Lab (Costs 5,000 points)
  const DUNK_CREATION_COST = 5000;
  const handleSaveCustomDunk = (newDunk: DunkMove) => {
    if (profile.points < DUNK_CREATION_COST) {
      setIsStoreOpen(true);
      showToast(`⚠️ 5,000 Points required to craft a custom dunk!`);
      return;
    }

    setDunks((prev) => [newDunk, ...prev]);
    setProfile((prev) => ({
      ...prev,
      points: prev.points - DUNK_CREATION_COST,
      unlockedDunkIds: [...prev.unlockedDunkIds, newDunk.id],
      customDunksCreated: prev.customDunksCreated + 1,
    }));

    // Also push a showcase card to the community highlights feed
    const showcaseHighlight: HighlightVideo = {
      id: `hl-custom-${Date.now()}`,
      title: `NEW LAB SIGNATURE: ${newDunk.name} by ${profile.name}!`,
      dunkerName: profile.name,
      dunkMoveName: newDunk.name,
      score: 50,
      date: 'Just now',
      likes: 18,
      likedByUser: true,
      views: 45,
      thumbnailGradient: 'from-purple-600 via-pink-700 to-neutral-900',
      filter: 'neon',
      sticker: 'CUSTOM LAB KING 🧪',
      commentsCount: 2,
      comments: [
        { user: 'SlamLabScout', text: `Verified in the lab: ${newDunk.scoreMultiplier}x multiplier!`, time: 'Just now' },
      ],
      isUserSubmission: true,
    };

    setHighlights((prev) => [showcaseHighlight, ...prev]);
    showToast(`🧪 Signature Move "${newDunk.name}" minted for 5,000 Points!`);
  };

  // 5. Collect creator royalties
  const handleCollectRoyalties = (amount: number) => {
    setProfile((prev) => ({
      ...prev,
      points: prev.points + amount,
      totalPointsEarned: prev.totalPointsEarned + amount,
    }));
    showToast(`💵 Royalties Claimed! +${amount.toLocaleString()} Dunk Points added to wallet.`);
  };

  // 6. Save highlight from contest or recorder
  const handleSaveHighlight = (partial: Partial<HighlightVideo>) => {
    const newHighlight: HighlightVideo = {
      id: `hl-${Date.now()}`,
      title: partial.title || 'Contest Slam Highlight',
      dunkerName: partial.dunkerName || profile.name,
      dunkMoveName: partial.dunkMoveName || 'Eastbay Windmill',
      score: partial.score || 50,
      date: 'Just now',
      likes: 1,
      likedByUser: true,
      views: 1,
      videoUrl: partial.videoUrl,
      thumbnailGradient: partial.thumbnailGradient || 'from-orange-600 via-amber-700 to-neutral-900',
      filter: partial.filter || 'none',
      sticker: partial.sticker || 'CERTIFIED 50 🌟',
      commentsCount: partial.comments?.length || 1,
      comments: partial.comments || [
        { user: 'HoopBot', text: 'Stuck the landing with massive elevation!', time: 'Just now' }
      ],
      isUserSubmission: true,
    };

    setHighlights((prev) => [newHighlight, ...prev]);
    
    // Reward for sharing highlight
    setProfile((prev) => ({
      ...prev,
      points: prev.points + 50,
      totalPointsEarned: prev.totalPointsEarned + 50,
    }));

    showToast(`📹 Highlight Published! +50 Dunk Points rewarded.`);
  };

  // 7. Like / Upvote highlight
  const handleLikeHighlight = (id: string) => {
    setHighlights((prev) =>
      prev.map((hl) => {
        if (hl.id === id) {
          const isLiked = hl.likedByUser;
          return {
            ...hl,
            likedByUser: !isLiked,
            likes: isLiked ? Math.max(0, hl.likes - 1) : hl.likes + 1,
          };
        }
        return hl;
      })
    );

    // Give viewer +5 points for community engagement
    setProfile((prev) => ({
      ...prev,
      points: prev.points + 5,
      totalPointsEarned: prev.totalPointsEarned + 5,
    }));
  };

  // 8. Add comment to highlight
  const handleAddComment = (id: string, text: string) => {
    setHighlights((prev) =>
      prev.map((hl) => {
        if (hl.id === id) {
          return {
            ...hl,
            comments: [...hl.comments, { user: profile.name, text, time: 'Just now' }],
            commentsCount: hl.commentsCount + 1,
          };
        }
        return hl;
      })
    );
  };

  // 9. Update user avatar (team colors, jersey number, styling)
  const handleUpdateAvatar = (newAvatar: AvatarConfig) => {
    setProfile((prev) => ({
      ...prev,
      avatar: newAvatar,
    }));
    showToast(`🎨 Jersey Updated! #${newAvatar.jerseyNumber} equipped on court.`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 font-black px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-flash-score border border-white/40">
          <span>🏀</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        profile={profile}
        onOpenStore={() => setIsStoreOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAvatarEditor={() => setIsAvatarEditorOpen(true)}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* VIEW 1: Slam Dunk Contest Arena */}
        {currentView === 'arena' && (
          <ContestArena
            unlockedDunks={unlockedDunks}
            profile={profile}
            onWinContest={handleWinContest}
            onSaveHighlight={handleSaveHighlight}
            onOpenStore={() => setIsStoreOpen(true)}
            onNavigateToVault={() => setCurrentView('vault')}
            onNavigateToCreator={() => setCurrentView('creator')}
            onNavigateToCharacter={() => setCurrentView('character')}
            onOpenAvatarEditor={() => setIsAvatarEditorOpen(true)}
          />
        )}

        {/* VIEW 2: Highlight Reels & Feed */}
        {currentView === 'highlights' && (
          <HighlightsFeed
            highlights={highlights}
            onOpenRecorder={() => setIsRecorderOpen(true)}
            onLikeHighlight={handleLikeHighlight}
            onAddComment={handleAddComment}
          />
        )}

        {/* VIEW 3: Dunk Vault (Unlock Moves with Points) */}
        {currentView === 'vault' && (
          <DunkVault
            dunks={dunks}
            profile={profile}
            onUnlockDunk={handleUnlockDunk}
            onOpenStore={() => setIsStoreOpen(true)}
            onSelectForArena={(dunk) => {
              setCurrentView('arena');
              showToast(`Equipped "${dunk.name}" for your next contest!`);
            }}
          />
        )}

        {/* VIEW 4: Dunk Lab / Custom Dunk Architect */}
        {currentView === 'creator' && (
          <DunkArchitect
            profile={profile}
            onSaveCustomDunk={handleSaveCustomDunk}
            onOpenStore={() => setIsStoreOpen(true)}
            onNavigateToArena={() => setCurrentView('arena')}
            onCollectRoyalties={handleCollectRoyalties}
            customDunks={customDunks}
          />
        )}

        {/* VIEW 5: Character Creator & Attribute Upgrading Studio */}
        {currentView === 'character' && (
          <CharacterCreator
            profile={profile}
            onUpdateProfile={(updated) => {
              setProfile((prev) => ({
                ...prev,
                ...updated,
              }));
            }}
            onOpenStore={() => setIsStoreOpen(true)}
            onNavigateToArena={() => setCurrentView('arena')}
          />
        )}

      </main>

      {/* Point Purchase Store Modal */}
      <PointStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        onPurchasePoints={handlePurchasePoints}
        currentPoints={profile.points}
      />

      {/* Highlight Recorder Studio Modal */}
      <HighlightRecorder
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        unlockedDunks={unlockedDunks}
        onPublishHighlight={handleSaveHighlight}
        dunkerName={profile.name}
      />

      {/* Avatar & Jersey Customizer Studio Modal */}
      <AvatarEditorModal
        isOpen={isAvatarEditorOpen}
        onClose={() => setIsAvatarEditorOpen(false)}
        currentAvatar={profile.avatar || DEFAULT_AVATAR_CONFIG}
        onSaveAvatar={handleUpdateAvatar}
        playerName={profile.name}
        playerHandle={profile.handle}
        rankTitle={profile.rankTitle}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/60 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-orange-500 uppercase tracking-wider text-sm">
              Slam Dunk Championship
            </span>
            <span>• Built for high-flying creators and hoop legends</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setIsStoreOpen(true)} className="hover:text-neutral-300">
              Buy Points
            </button>
            <span>•</span>
            <button onClick={() => setCurrentView('creator')} className="hover:text-neutral-300">
              Dunk Lab
            </button>
            <span>•</span>
            <button onClick={() => setIsRecorderOpen(true)} className="hover:text-neutral-300">
              Record Highlight
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
