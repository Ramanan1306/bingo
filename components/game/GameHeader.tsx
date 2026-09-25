'use client';

import { useEffect } from 'react';
import { GameState } from '@/types/game';
import { Share2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GameHeader({ gameState, playerId }: { gameState: GameState, playerId: string }) {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use keepalive or navigator.sendBeacon to ensure it goes through
      navigator.sendBeacon('/api/game/leave', JSON.stringify({ roomId: gameState.roomId, playerId }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameState.roomId, playerId]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Join my Bingo Game',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!'); // Fallback simple toast
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave the game?')) {
      try {
        await fetch('/api/game/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: gameState.roomId, playerId })
        });
      } catch (err) {
        console.error(err);
      }
      router.push('/');
    }
  };

  const playerCount = Object.keys(gameState.players).length;

  return (
    <header className="glass-panel border-b border-white/5 py-4 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-accent glow-text">
          BINGO
        </h1>
        <div className="hidden sm:flex items-center gap-2 text-sm bg-bg-secondary px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-text-muted">Room:</span>
          <span className="font-mono font-bold">{gameState.roomId}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="text-text-muted">Players:</span>
          <span className="font-bold">{playerCount}/2</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-2 bg-bg-secondary hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white"
            title="Share Game"
          >
            <Share2 size={18} />
          </button>
          
          <button 
            onClick={handleLeave}
            className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors ml-2"
            title="Leave Game"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
