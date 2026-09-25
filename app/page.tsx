'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, LogIn, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [view, setView] = useState<'home' | 'create' | 'join'>('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Helper to ensure we have a persistent player ID across the session
  const getPlayerId = () => {
    let pid = localStorage.getItem('bingo_player_id');
    if (!pid) {
      pid = uuidv4();
      localStorage.setItem('bingo_player_id', pid);
    }
    return pid;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const playerId = getPlayerId();
      localStorage.setItem('bingo_player_name', playerName);
      
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, playerId })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      
      router.push(`/game/${data.roomId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const playerId = getPlayerId();
      localStorage.setItem('bingo_player_name', playerName);
      
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: roomCode.toUpperCase(), playerName, playerId })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to join room');
      
      router.push(`/game/${roomCode.toUpperCase()}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Particles / Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.h1 
            className="text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white to-accent glow-text mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            BINGO
          </motion.h1>
          <p className="text-text-muted text-lg">
            Challenge someone. Call your numbers. Get Bingo first.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setView('create')}
                  className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] glow-box"
                >
                  <PlusCircle size={20} />
                  CREATE GAME
                </button>
                <button
                  onClick={() => setView('join')}
                  className="w-full flex items-center justify-center gap-3 bg-bg-secondary hover:bg-bg-secondary/80 text-white py-4 rounded-xl font-bold border border-white/10 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogIn size={20} />
                  JOIN GAME
                </button>
              </motion.div>
            )}

            {view === 'create' && (
              <motion.form
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleCreateRoom}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <button type="button" onClick={() => setView('home')} className="text-text-muted hover:text-white transition-colors">&larr;</button>
                  Create Game
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">PLAYER NAME</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    maxLength={15}
                    className="w-full bg-bg-base border border-white/10 rounded-xl p-4 text-white placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {error && <p className="text-danger text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || !playerName.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-box mt-6"
                >
                  {isLoading ? 'CREATING...' : 'CREATE ROOM'}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </motion.form>
            )}

            {view === 'join' && (
              <motion.form
                key="join"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleJoinRoom}
                className="space-y-4"
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <button type="button" onClick={() => setView('home')} className="text-text-muted hover:text-white transition-colors">&larr;</button>
                  Join Game
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">ROOM CODE</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BGO-7X92"
                    required
                    maxLength={10}
                    className="w-full bg-bg-base border border-white/10 rounded-xl p-4 text-white placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono uppercase tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2 mt-4">PLAYER NAME</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    maxLength={15}
                    className="w-full bg-bg-base border border-white/10 rounded-xl p-4 text-white placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>

                {error && <p className="text-danger text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || !playerName.trim() || !roomCode.trim()}
                  className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-accent-hover text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-box mt-6"
                >
                  {isLoading ? 'JOINING...' : 'JOIN ROOM'}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
