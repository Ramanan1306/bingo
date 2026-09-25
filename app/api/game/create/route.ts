import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BGO-${result}`;
}

export async function POST(request: Request) {
  try {
    const { playerName, playerId } = await request.json();

    if (!playerName || !playerId) {
      return NextResponse.json({ error: 'Missing player details' }, { status: 400 });
    }

    const roomId = generateRoomId();

    const initialState: GameState = {
      roomId,
      status: 'WAITING_FOR_PLAYERS',
      players: {
        [playerId]: {
          id: playerId,
          name: playerName,
          isReady: false,
          connected: true,
          board: []
        }
      },
      player1Id: playerId,
      player2Id: null,
      currentTurn: null,
      calledNumbers: [],
      winner: null,
      winningLines: {},
      rematchRequests: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Clean up old games (inactive for 5 minutes)
    try {
      await sql`DELETE FROM games WHERE updated_at < NOW() - INTERVAL '5 minutes'`;
    } catch (cleanupErr) {
      console.error('Failed to cleanup old games:', cleanupErr);
    }

    await sql`
      INSERT INTO games (id, state) 
      VALUES (${roomId}, ${JSON.stringify(initialState)}::jsonb)
    `;

    return NextResponse.json({ roomId, state: initialState });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
