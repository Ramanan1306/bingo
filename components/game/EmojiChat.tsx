'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, EmojiMessage } from '@/types/game';

const EMOJIS = ['😂', '😡', '😭', '💀', '🎉', '👍', '👎', '🤯'];

export default function EmojiChat({ gameState, playerId }: { gameState: GameState, playerId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{id: string, emoji: string, left: number, isMe: boolean}[]>([]);
  const lastProcessedMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!gameState.messages || gameState.messages.length === 0) return;

    // Find new messages
    const newMessages = [];
    let foundLast = lastProcessedMessageId.current === null;
    
    for (const msg of gameState.messages) {
      if (foundLast) {
        newMessages.push(msg);
      } else if (msg.id === lastProcessedMessageId.current) {
        foundLast = true;
      }
    }

    if (!foundLast) {
      // Last message not found (maybe truncated), just take the last few
      newMessages.push(...gameState.messages.slice(-5));
    }

    if (newMessages.length > 0) {
      lastProcessedMessageId.current = newMessages[newMessages.length - 1].id;
      
      const newFloating = newMessages.map(msg => ({
        id: msg.id,
        emoji: msg.emoji,
        left: msg.playerId === playerId ? 80 : 20, // Different sides for me and opponent
        isMe: msg.playerId === playerId
      }));
      
      setFloatingEmojis(prev => [...prev, ...newFloating]);
      
      // Remove them after animation
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(p => !newFloating.find(n => n.id === p.id)));
      }, 3000);
    }
  }, [gameState.messages, playerId]);

  const sendEmoji = async (emoji: string) => {
    setIsOpen(false);
    
    try {
      await fetch('/api/game/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: gameState.roomId, playerId, emoji })
      });
      // The polling will pick it up and show it, but for immediate feedback we could add it locally
    } catch (err) {
      console.error('Failed to send emoji', err);
    }
  };

  return (
    <>
      {/* Floating Emojis Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{ y: '100vh', opacity: 1, x: `calc(${item.left}vw + ${Math.random() * 20 - 10}px)`, scale: 0.5 }}
              animate={{ y: '-20vh', opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
              className="absolute bottom-0 text-5xl sm:text-7xl"
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Emoji Picker Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 bg-bg-secondary border border-white/10 p-3 rounded-2xl shadow-xl flex flex-wrap gap-2 w-[220px]"
            >
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => sendEmoji(e)}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-colors"
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-accent hover:bg-accent-hover rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/20 transition-transform active:scale-95"
        >
          {isOpen ? '❌' : '💬'}
        </button>
      </div>
    </>
  );
}
