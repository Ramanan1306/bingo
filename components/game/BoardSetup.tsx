'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/types/game';
import { generateRandomBoard, validateBoard } from '@/lib/bingoLogic';
import { Shuffle, CheckCircle, Edit3 } from 'lucide-react';

export default function BoardSetup({ gameState, playerId }: { gameState: GameState, playerId: string }) {
  const player = gameState.players[playerId];
  const [board, setBoard] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize board if empty
  useEffect(() => {
    if (board.length === 0 && !player.isReady) {
      if (player.board && player.board.length === 25) {
        setBoard(player.board);
      } else {
        setBoard(generateRandomBoard());
      }
    }
  }, [player.board, player.isReady, board.length]);

  const handleRandomize = () => {
    if (player.isReady) return;
    setBoard(generateRandomBoard());
    setError('');
  };

  const handleReady = async () => {
    if (player.isReady) return; // Already ready
    if (!validateBoard(board)) {
      setError('Board configuration is invalid. Please randomize again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/game/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: gameState.roomId, playerId, board })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set ready');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const p1 = gameState.players[gameState.player1Id!];
  const p2 = gameState.players[gameState.player2Id!];

  return (
    <div className="w-full max-w-4xl mt-4 sm:mt-10 flex flex-col lg:flex-row gap-8">
      
      {/* Board Column */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Your Board</h2>
          {player.isReady && (
            <span className="text-success font-bold flex items-center gap-1 bg-success/10 px-3 py-1 rounded-full text-sm">
              <CheckCircle size={16} /> READY
            </span>
          )}
        </div>
        
        <div className="glass-panel p-4 sm:p-6 rounded-3xl">
          {/* Header B I N G O */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
            {['B', 'I', 'N', 'G', 'O'].map((letter) => (
              <div key={letter} className="text-center font-black text-2xl sm:text-3xl text-accent glow-text">
                {letter}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {board.length === 25 ? board.map((num, idx) => (
              <motion.div
                key={`${idx}-${num}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: Math.random() * 0.2 }}
                className={`
                  aspect-square rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold border-2
                  ${player.isReady ? 'bg-bg-secondary border-white/5 opacity-80' : 'bg-bg-base border-white/10 hover:border-accent/50'}
                  transition-colors
                `}
              >
                {num}
              </motion.div>
            )) : (
              // Loading placeholders
              Array(25).fill(0).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Controls Column */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="font-bold mb-4">Setup</h3>
          <p className="text-sm text-text-muted mb-6">
            Review your board. You can randomize it until you're happy with the numbers.
          </p>
          
          <button
            onClick={handleRandomize}
            disabled={player.isReady || isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-bg-secondary hover:bg-bg-secondary/80 text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-50 mb-4"
          >
            <Shuffle size={18} />
            RANDOMIZE BOARD
          </button>
          
          {error && <p className="text-danger text-sm mb-4 text-center">{error}</p>}
          
          <button
            onClick={handleReady}
            disabled={player.isReady || isSubmitting || board.length === 0}
            className={`
              w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all transform
              ${player.isReady 
                ? 'bg-success/20 text-success border border-success/30 cursor-default' 
                : 'bg-accent hover:bg-accent-hover text-white hover:scale-[1.02] active:scale-[0.98] glow-box'
              }
            `}
          >
            {isSubmitting ? 'SAVING...' : player.isReady ? '✓ READY' : 'READY TO PLAY'}
          </button>
        </div>

        {/* Players Status */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="font-bold mb-4">Players Status</h3>
          <div className="space-y-4">
            <PlayerStatusRow player={p1} isMe={p1.id === playerId} />
            {p2 ? (
               <PlayerStatusRow player={p2} isMe={p2.id === playerId} />
            ) : (
               <div className="flex items-center justify-between opacity-50">
                 <span className="font-medium text-text-muted text-sm border border-dashed border-white/20 rounded-md px-2 py-1">Waiting...</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerStatusRow({ player, isMe }: { player: any, isMe: boolean }) {
  return (
    <div className="flex items-center justify-between bg-bg-base/50 p-3 rounded-lg border border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center font-bold text-xs">
          {player.name.substring(0, 2).toUpperCase()}
        </div>
        <span className="font-medium truncate max-w-[100px]">
          {player.name} {isMe && <span className="text-xs text-accent">(You)</span>}
        </span>
      </div>
      <div>
        {player.isReady ? (
          <span className="text-success text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> READY</span>
        ) : (
          <span className="text-warning text-xs font-bold flex items-center gap-1"><Edit3 size={14}/> SETUP</span>
        )}
      </div>
    </div>
  );
}
