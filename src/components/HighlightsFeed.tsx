import React, { useState } from 'react';
import { Video, Heart, MessageSquare, Share2, Play, Pause, Flame, Sparkles, Filter, Plus, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HighlightVideo, DunkMove } from '../types';
import { sound } from '../utils/audio';

interface HighlightsFeedProps {
  highlights: HighlightVideo[];
  onOpenRecorder: () => void;
  onLikeHighlight: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
}

export const HighlightsFeed: React.FC<HighlightsFeedProps> = ({
  highlights,
  onOpenRecorder,
  onLikeHighlight,
  onAddComment,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'legends' | 'user'>('all');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(highlights[0]?.id || null);
  const [slowMoMap, setSlowMoMap] = useState<Record<string, boolean>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHighlights = highlights.filter((hl) => {
    if (filterTab === 'legends') return hl.score === 50;
    if (filterTab === 'user') return hl.isUserSubmission;
    return true;
  });

  const toggleSlowMo = (id: string) => {
    const nextVal = !slowMoMap[id];
    setSlowMoMap((prev) => ({ ...prev, [id]: nextVal }));
    if (nextVal) {
      sound.playSlowMoWhoosh();
    } else {
      sound.playBounce();
    }
  };

  const handleLike = (id: string) => {
    onLikeHighlight(id);
    sound.playCrowdCheer();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#f97316', '#ef4444', '#f59e0b']
    });
  };

  const handleShare = (id: string) => {
    sound.playJudgeChime();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const text = (commentInputMap[id] || '').trim();
    if (!text) return;
    onAddComment(id, text);
    setCommentInputMap((prev) => ({ ...prev, [id]: '' }));
    sound.playBounce();
  };

  return (
    <div id="highlights-feed" className="space-y-6">
      
      {/* Feed Hero / Action Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Community Tape Vault
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black border border-orange-500/30">
              LIVE REEL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-wide text-white">
            Slam Dunk Highlight Reel
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
            Watch legendary 50-point throws, toggle slow-mo replays, and record your own high-flying clips to earn community points and royalties!
          </p>
        </div>

        <button
          id="open-recorder-hero-btn"
          onClick={onOpenRecorder}
          className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 shrink-0"
        >
          <Plus className="w-5 h-5 text-neutral-950 stroke-[3]" />
          <span>Record New Highlight</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🔥 All Highlights ({highlights.length})
          </button>

          <button
            onClick={() => setFilterTab('legends')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterTab === 'legends'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🌟 50-Point Legends
          </button>

          <button
            onClick={() => setFilterTab('user')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterTab === 'user'
                ? 'bg-neutral-800 text-orange-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            👤 My Uploads
          </button>
        </div>

        <div className="text-xs text-neutral-400 hidden sm:flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Earn +10 PTS per like received</span>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHighlights.map((hl) => {
          const isSlowMo = !!slowMoMap[hl.id];
          const isPlaying = activePlayingId === hl.id;

          return (
            <div
              key={hl.id}
              id={`highlight-card-${hl.id}`}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-neutral-700 transition-colors"
            >
              <div>
                
                {/* Video Playback / Showcase Canvas Box */}
                <div className="relative aspect-video bg-neutral-950 overflow-hidden flex items-center justify-center">
                  
                  {/* Real Video playback if present */}
                  {hl.videoUrl ? (
                    <video
                      src={hl.videoUrl}
                      controls
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* High-energy animated dunk canvas card */
                    <div className={`w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br ${hl.thumbnailGradient}`}>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-amber-400 font-black text-xs uppercase tracking-wider border border-amber-500/30">
                          {hl.score === 50 ? '🌟 PERFECT 50' : `${hl.score} PTS SLAM`}
                        </span>

                        <div className="flex items-center gap-2">
                          {isSlowMo && (
                            <span className="px-2.5 py-1 rounded-xl bg-orange-500/30 backdrop-blur-md text-orange-300 font-black text-[10px] uppercase tracking-wider border border-orange-400/50 flex items-center gap-1.5 animate-pulse shadow-md">
                              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                              <span>0.5X SLOW-MO TAPE</span>
                            </span>
                          )}

                          {hl.sticker && (
                            <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-white font-black text-xs uppercase tracking-wider border border-white/20 transform rotate-2">
                              {hl.sticker}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`text-center my-auto transition-all ${isSlowMo ? 'duration-1000 scale-105' : 'duration-300'}`}>
                        <div className={`text-6xl mb-2 filter drop-shadow ${isSlowMo ? 'animate-bounce [animation-duration:2.5s]' : 'animate-pulse'}`}>
                          🏀✨
                        </div>
                        <div className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                          {hl.dunkMoveName}
                        </div>
                        <div className="text-xs text-neutral-300 font-semibold mt-1">
                          Performed by {hl.dunkerName}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>{hl.views.toLocaleString()} views</span>
                        <span>{hl.date}</span>
                      </div>
                    </div>
                  )}

                  {/* Slow-mo badge control */}
                  <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                    <button
                      onClick={() => toggleSlowMo(hl.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all ${
                        isSlowMo
                          ? 'bg-orange-500 text-neutral-950 border-orange-400 font-black shadow-lg'
                          : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                      }`}
                    >
                      {isSlowMo ? 'Slow-Mo 0.5x Active' : 'Speed: 1.0x'}
                    </button>
                    
                    <button
                      onClick={() => sound.playCrowdCheer()}
                      className="p-1.5 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-md border border-white/20"
                      title="Play Arena Roar"
                    >
                      <Volume2 className="w-4 h-4 text-orange-400" />
                    </button>
                  </div>

                </div>

                {/* Video Info Section */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black font-display text-white uppercase tracking-wide">
                      {hl.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span className="font-semibold text-neutral-300">{hl.dunkerName}</span>
                      <span>•</span>
                      <span className="text-orange-400 font-bold">{hl.dunkMoveName}</span>
                      <span>•</span>
                      <span>{hl.date}</span>
                    </div>
                  </div>

                  {/* Like, Share, View Stats Bar */}
                  <div className="flex items-center justify-between border-y border-neutral-800 py-3">
                    <div className="flex items-center gap-4">
                      {/* Like button */}
                      <button
                        onClick={() => handleLike(hl.id)}
                        className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-transform active:scale-125 ${
                          hl.likedByUser ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hl.likedByUser ? 'fill-rose-500' : ''}`} />
                        <span>{hl.likes}</span>
                      </button>

                      {/* Comments count */}
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-400 font-bold">
                        <MessageSquare className="w-4 h-4" />
                        <span>{hl.comments.length}</span>
                      </div>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(hl.id)}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedId === hl.id ? 'Copied Link! ✓' : 'Share'}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Arena Chatter ({hl.comments.length})
                    </div>

                    <div className="max-h-28 overflow-y-auto space-y-2 pr-1 text-xs">
                      {hl.comments.map((c, idx) => (
                        <div key={idx} className="bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800">
                          <span className="font-bold text-orange-400 mr-2">{c.user}:</span>
                          <span className="text-neutral-300">{c.text}</span>
                          <span className="text-[10px] text-neutral-500 ml-2">({c.time})</span>
                        </div>
                      ))}
                    </div>

                    {/* Add comment input */}
                    <form onSubmit={(e) => handleCommentSubmit(e, hl.id)} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputMap[hl.id] || ''}
                        onChange={(e) => setCommentInputMap((prev) => ({ ...prev, [hl.id]: e.target.value }))}
                        placeholder="Drop a reaction or judge score..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                      >
                        Post
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
