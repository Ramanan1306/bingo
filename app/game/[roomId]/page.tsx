'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeGame } from '@/hooks/useRealtimeGame';
import Lobby from '@/components/game/Lobby';
import BoardSetup from '@/components/game/BoardSetup';
import MainGame from '@/components/game/MainGame';
import GameHeader from '@/components/game/GameHeader';
import EmojiChat from '@/components/game/EmojiChat';

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const { roomId } = use(params);
  const { gameState, loading, error, setGameState } = useRealtimeGame(roomId);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const storedPid = localStorage.getItem('bingo_player_id');
    const storedName = localStorage.getItem('bingo_player_name');
    
    if (!storedPid || !storedName) {
      // Not joined properly, go to home
      router.push('/');
      return;
    }
    
    setPlayerId(storedPid);
  }, [router]);

  if (loading || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-danger mb-4">Error</h2>
          <p className="text-text-muted mb-6">{error || 'Game not found'}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-accent px-6 py-3 rounded-xl font-bold hover:bg-accent-hover transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Ensure current player is in the game
  if (!gameState.players[playerId]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-danger mb-4">Access Denied</h2>
          <p className="text-text-muted mb-6">You are not part of this game.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-accent px-6 py-3 rounded-xl font-bold hover:bg-accent-hover transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <GameHeader gameState={gameState} playerId={playerId} />
      
      <main className="flex-1 flex flex-col items-center p-4 overflow-y-auto">
        {gameState.status === 'WAITING_FOR_PLAYERS' && (
          <Lobby gameState={gameState} playerId={playerId} />
        )}
        
        {(gameState.status === 'BOARD_SETUP' || gameState.status === 'WAITING_FOR_READY') && (
          <BoardSetup gameState={gameState} playerId={playerId} />
        )}
        
        {(gameState.status === 'COUNTDOWN' || 
          gameState.status === 'PLAYING' || 
          gameState.status === 'WINNER_DETECTED' || 
          gameState.status === 'FINISHED' ||
          gameState.status === 'REMATCH') && (
          <MainGame gameState={gameState} playerId={playerId} setGameState={setGameState} />
        )}
      </main>
      
      {/* Global Game Components */}
      <EmojiChat gameState={gameState} playerId={playerId} />
    </div>
  );
}
