'use client';

import { useEffect, useState } from 'react';
import { GameState } from '@/types/game';

export function useRealtimeGame(roomId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchState() {
      try {
        const res = await fetch(`/api/game/state?roomId=${roomId}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load game');
        }

        if (isMounted) {
          setGameState(data.state as GameState);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Failed to fetch state:", err);
          setError(err instanceof Error ? err.message : 'Failed to load game');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchState();
    
    // Poll every 1.5 seconds for realtime state updates
    const intervalId = setInterval(fetchState, 1500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [roomId]);

  return { gameState, loading, error, setGameState };
}
