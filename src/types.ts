export type ViewMode = 'arena' | 'highlights' | 'vault' | 'creator' | 'character' | 'store';

export interface DunkMove {
  id: string;
  name: string;
  nickname: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme' | 'Legendary';
  difficultyStars: number;
  cost: number; // 0 if starter
  unlocked: boolean;
  hangtimeRequired: number; // in seconds
  scoreMultiplier: number;
  description: string;
  takeoff: string;
  inAirMotion: string;
  finishStyle: string;
  auraColor: string;
  isCustom?: boolean;
  creatorName?: string;
  creatorEarnings?: number;
}

export interface JudgeScore {
  judgeId: string;
  judgeName: string;
  judgeRole: string;
  judgeAvatar: string;
  score: number; // 6 to 10
  comment: string;
}

export interface ContestRound {
  roundNumber: number;
  selectedDunk: DunkMove;
  userScore: number;
  judges: JudgeScore[];
  rivalScore: number;
  rivalName: string;
  rivalDunkName: string;
  timingAccuracy: 'PERFECT' | 'GREAT' | 'GOOD' | 'CLANK';
  hangtimeAchieved: number;
  pointsEarned: number;
}

export interface HighlightVideo {
  id: string;
  title: string;
  dunkerName: string;
  dunkMoveName: string;
  score: number;
  date: string;
  likes: number;
  likedByUser: boolean;
  views: number;
  videoUrl?: string; // Data URL or recorded blob
  thumbnailGradient: string;
  filter: 'none' | 'vhs' | 'neon' | 'fire' | 'retro';
  sticker?: string;
  commentsCount: number;
  comments: { user: string; text: string; time: string }[];
  isUserSubmission?: boolean;
}

export interface TeamColorScheme {
  id: string;
  name: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  numberColor: string;
  pattern?: 'classic' | 'modern' | 'pinstripe' | 'gradient' | 'split';
}

export interface AvatarConfig {
  teamColorSchemeId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  numberColor: string;
  jerseyNumber: number; // 0 - 99
  jerseyStyle: 'classic' | 'modern' | 'pinstripe' | 'split';
  playerSkinTone: string;
  headband: boolean;
  headbandColor: string;
  hairStyle: 'short' | 'afro' | 'dreads' | 'fade' | 'bald';
  accessory: 'none' | 'arm_sleeve' | 'wristband' | 'face_mask';
  accessoryColor: string;
}

export interface PlayerAttributes {
  verticalLeap: number;       // 60 - 99: Increases apex jump height & judge elevation rating
  hangtimeFloat: number;      // 60 - 99: Extends hangtime in air & smooths meter speed
  takeoffVelocity: number;    // 60 - 99: Increases runway sprint momentum & multiplier boost
  rimImpactForce: number;     // 60 - 99: Boosts backboard rattle, crowd excitement & power finish score
  timingPrecision: number;    // 60 - 99: Expands green sweet-spot target zone on meters
}

export interface CharacterBio {
  position: 'Point Guard' | 'Shooting Guard' | 'Small Forward' | 'Power Forward' | 'Center';
  archetype: 'Slashing Skywalker' | 'Aerospace Wing' | 'Power Rim Destroyer' | 'Freestyle Aerialist' | 'Clutch Hangtime Maestro';
  height: string;
  wingspan: string;
  signatureCelebration: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  points: number;
  totalPointsEarned: number;
  contestsWon: number;
  contestsPlayed: number;
  rankTitle: string;
  highestScore: number;
  unlockedDunkIds: string[];
  customDunksCreated: number;
  avatar: AvatarConfig;
  attributes: PlayerAttributes;
  bio: CharacterBio;
}

export interface StorePackage {
  id: string;
  points: number;
  bonusPoints: number;
  priceUsd: number;
  tag?: string;
  popular?: boolean;
  perks: string[];
}
