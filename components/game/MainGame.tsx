'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/types/game';
 
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MainGame({ gameState, playerId, setGameState }: { gameState: GameState, playerId: string, setGameState?: (state: GameState) => void }) {
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(gameState.status === 'COUNTDOWN');
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState('');
  const [popupNumber, setPopupNumber] = useState<number | null>(null);

  const isMyTurn = gameState.currentTurn === (gameState.player1Id === playerId ? 'PLAYER_1' : 'PLAYER_2');
  const opponentId = gameState.player1Id === playerId ? gameState.player2Id! : gameState.player1Id!;
  
  const me = gameState.players[playerId];
  const opponent = gameState.players[opponentId];

  // Handle countdown
  useEffect(() => {
    if (gameState.status === 'COUNTDOWN' && showCountdown) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setShowCountdown(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState.status, countdown, showCountdown]);

  // Winner Confetti
  useEffect(() => {
    if (gameState.status === 'WINNER_DETECTED' && gameState.winner) {
      if (gameState.winner === playerId || gameState.winner === 'DRAW') {
        // I won or draw
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C5CFF', '#32D583', '#FFFFFF']
        });
      }
    }
  }, [gameState.status, gameState.winner, playerId]);

  const lastCalled = gameState.calledNumbers.length > 0 ? gameState.calledNumbers[gameState.calledNumbers.length - 1] : null;

  useEffect(() => {
    if (lastCalled !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPopupNumber(lastCalled);
      const timer = setTimeout(() => setPopupNumber(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastCalled]);

  const handleCallNumber = async (num: number) => {
    if (isCalling || !isMyTurn) return;
    
    setIsCalling(true);
    setError('');
    
    try {
      const res = await fetch('/api/game/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: gameState.roomId, playerId, number: num })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to call number');
      
      if (setGameState && data.state) {
        setGameState(data.state);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCalling(false);
    }
  };

  const handleRematch = async () => {
    try {
      await fetch('/api/game/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: gameState.roomId, playerId })
      });
    } catch (err) {
      console.error('Rematch error', err);
    }
  };

  if (showCountdown) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-9xl font-black text-accent glow-text"
        >
          {countdown > 0 ? countdown : 'GO!'}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mt-4 flex flex-col gap-6 relative">
      
      {/* Number Popup Overlay */}
      <AnimatePresence>
        {popupNumber !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-white to-gray-300 shadow-[inset_-20px_-20px_40px_rgba(0,0,0,0.2),_0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center relative">
              <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-inner border border-gray-100">
                <span className="text-8xl font-black text-black">{popupNumber}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top Banner (Turn or Winner) */}
      <AnimatePresence mode="wait">
        {gameState.status === 'WINNER_DETECTED' || gameState.status === 'FINISHED' || gameState.status === 'REMATCH' ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl text-center shadow-lg border-2 ${gameState.winner === playerId ? 'bg-success/20 border-success glow-success' : gameState.winner === 'DRAW' ? 'bg-warning/20 border-warning' : 'bg-danger/20 border-danger'}`}
          >
            <h2 className="text-3xl font-black mb-2">
              {gameState.winner === 'DRAW' ? 'DRAW!' : gameState.winner === playerId ? '🎉 YOU WON!' : `${opponent.name} WON`}
            </h2>
            <p className="mb-4">
              {gameState.winner === 'DRAW' ? 'Both players got Bingo at the same time.' : gameState.winner === playerId ? 'Congratulations! You got Bingo first.' : 'Better luck next time!'}
            </p>
            
            <button
              onClick={handleRematch}
              disabled={gameState.rematchRequests?.includes(playerId)}
              className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw size={20} className={gameState.rematchRequests?.includes(playerId) ? 'animate-spin' : ''} />
              {gameState.rematchRequests?.includes(playerId) ? 'WAITING FOR OPPONENT...' : 'PLAY AGAIN'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={isMyTurn ? 'my-turn' : 'opp-turn'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl flex items-center justify-center gap-3 border-2 ${isMyTurn ? 'bg-accent/20 border-accent glow-box' : 'bg-bg-secondary/50 border-white/5'}`}
          >
            <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
            <h2 className={`text-xl font-bold tracking-widest ${isMyTurn ? 'text-white' : 'text-text-muted'}`}>
              {isMyTurn ? 'YOUR TURN' : `${opponent.name.toUpperCase()}'S TURN`}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content (Boards) */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md">
            <PlayerBoard 
              player={me} 
              isMe={true} 
              calledNumbers={gameState.calledNumbers} 
              winningLines={gameState.winningLines[playerId]}
              onSelectNumber={handleCallNumber}
              isMyTurn={isMyTurn}
            />
            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-danger text-sm">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerBoard({ player, isMe, calledNumbers, winningLines, onSelectNumber, isMyTurn }: { player: { name: string, board: number[] }, isMe: boolean, calledNumbers: number[], winningLines?: number[][], onSelectNumber?: (num: number) => void, isMyTurn?: boolean }) {
  const linesCount = winningLines ? winningLines.length : 0;
  const isWinner = linesCount >= 5;
  const bingoWord = "BINGO";
  const spelledWord = bingoWord.slice(0, Math.min(linesCount, 5)).split('').join(' ');

  // Flatten winning lines to easily check if a cell is part of a win
  const winningIndices = new Set<number>();
  if (winningLines) {
    winningLines.forEach(line => line.forEach(idx => winningIndices.add(idx)));
  }

  return (
    <div className={`glass-panel p-4 sm:p-6 rounded-3xl relative overflow-hidden ${isWinner ? 'border-2 border-success/50 shadow-[0_0_30px_rgba(50,213,131,0.2)]' : ''}`}>
      {isWinner && <div className="absolute inset-0 bg-success/5 pointer-events-none" />}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center font-bold text-sm shadow-lg">
            {player.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{player.name} {isMe && <span className="text-xs text-accent">(YOU)</span>}</h3>
            {isWinner && <p className="text-success text-xs font-bold flex items-center gap-1"><Trophy size={12}/> BINGO!</p>}
          </div>
        </div>
        <div className="text-right flex items-center h-full">
          {!isWinner && (
            <p className="text-accent text-xl font-black glow-text tracking-[0.2em] min-h-[28px]">
              {spelledWord}
            </p>
          )}
        </div>
      </div>

      {/* Header B I N G O */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-2">
        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
          <div key={letter} className="text-center font-black text-xl sm:text-2xl text-accent glow-text">
            {letter}
          </div>
        ))}
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {player.board.map((num: number, idx: number) => {
          const isMarked = calledNumbers.includes(num);
          const isWinningCell = winningIndices.has(idx);
          const justCalled = calledNumbers[calledNumbers.length - 1] === num;
          const canSelect = isMe && isMyTurn && !isMarked;
          
          return (
            <motion.div
              key={idx}
              onClick={() => canSelect && onSelectNumber?.(num)}
              animate={
                justCalled ? { scale: [1, 0.8, 1.1, 1] } : 
                isWinningCell ? { scale: [1, 1.05, 1], backgroundColor: ['rgba(50,213,131,0.2)', 'rgba(50,213,131,0.5)', 'rgba(50,213,131,0.2)'] } : 
                {}
              }
              transition={{ duration: justCalled ? 0.5 : 2, repeat: isWinningCell ? Infinity : 0 }}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-base sm:text-xl font-bold relative border transition-colors
                ${canSelect ? 'cursor-pointer hover:bg-white/10 hover:border-accent' : ''}
                ${isWinningCell ? 'border-success text-success glow-success z-10' : 
                  isMarked ? 'bg-bg-secondary border-accent/30 text-white/50' : 
                  'bg-bg-base border-white/5'}
              `}
            >
              <span className={isMarked && !isWinningCell ? 'opacity-50' : ''}>{num}</span>
              
              {/* Mark Overlay */}
              {isMarked && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
                >
                  <div className={`w-[80%] h-[80%] rounded-full border-4 ${isWinningCell ? 'border-success' : 'border-accent/80'} opacity-70`} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
