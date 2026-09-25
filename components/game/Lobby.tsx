'use client';

import { GameState } from '@/types/game';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function Lobby({ gameState, playerId }: { gameState: GameState, playerId: string }) {
  const [copied, setCopied] = useState(false);
  const p1 = gameState.player1Id ? gameState.players[gameState.player1Id] : null;
  const p2 = gameState.player2Id ? gameState.players[gameState.player2Id] : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mt-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 rounded-3xl text-center"
      >
        <h2 className="text-2xl font-bold mb-2">Waiting for Player 2...</h2>
        <p className="text-text-muted mb-8">Share this room code with your opponent</p>

        <div className="bg-bg-base/50 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="text-left">
            <p className="text-xs text-text-muted font-bold tracking-wider mb-1">ROOM CODE</p>
            <p className="font-mono text-3xl font-black tracking-widest text-accent glow-text">{gameState.roomId}</p>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-lg font-bold transition-colors w-full sm:w-auto"
          >
            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
            {copied ? 'COPIED!' : 'COPY LINK'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlayerCard 
            player={p1} 
            title="PLAYER 1" 
            isMe={p1?.id === playerId} 
          />
          <PlayerCard 
            player={p2} 
            title="PLAYER 2" 
            isMe={p2?.id === playerId}
            isWaiting={!p2}
          />
        </div>
      </motion.div>
    </div>
  );
}

function PlayerCard({ player, title, isMe, isWaiting }: { player: any, title: string, isMe?: boolean, isWaiting?: boolean }) {
  if (isWaiting) {
    return (
      <div className="border border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center h-40 bg-white/5 opacity-50">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 mb-3 animate-pulse" />
        <p className="text-text-muted font-bold tracking-wider text-sm">WAITING...</p>
      </div>
    );
  }

  return (
    <div className={`glass-panel border-2 ${isMe ? 'border-accent/50' : 'border-white/5'} rounded-2xl p-6 flex flex-col items-center justify-center h-40 relative overflow-hidden`}>
      {isMe && <div className="absolute top-0 left-0 w-full h-1 bg-accent glow-box" />}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-xl font-black mb-3 shadow-lg">
        {player.name.substring(0, 2).toUpperCase()}
      </div>
      <p className="font-bold text-lg">{player.name} {isMe && <span className="text-xs text-accent">(YOU)</span>}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className={`w-2 h-2 rounded-full ${player.connected ? 'bg-success shadow-[0_0_8px_#32D583]' : 'bg-danger'}`} />
        <span className="text-xs text-text-muted">{player.connected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
}
