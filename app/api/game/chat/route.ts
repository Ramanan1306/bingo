import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { roomId, playerId, emoji } = await request.json();

    if (!roomId || !playerId || !emoji) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }

    let retries = 3;
    while (retries > 0) {
      const rows = await sql`SELECT state, version FROM games WHERE id = ${roomId}`;

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const state = rows[0].state as GameState;
      const version = rows[0].version;

      const isPlayer1 = state.player1Id === playerId;
      const isPlayer2 = state.player2Id === playerId;

      if (!isPlayer1 && !isPlayer2) {
        return NextResponse.json({ error: 'Player not in game' }, { status: 403 });
      }

      if (!state.messages) {
        state.messages = [];
      }

      state.messages.push({
        id: crypto.randomUUID(),
        playerId,
        emoji,
        timestamp: Date.now(),
      });

      // Keep only last 50 messages
      if (state.messages.length > 50) {
        state.messages = state.messages.slice(-50);
      }

      state.updatedAt = Date.now();

      const updateResult = await sql`
        UPDATE games 
        SET state = ${JSON.stringify(state)}::jsonb, version = version + 1 
        WHERE id = ${roomId} AND version = ${version} 
        RETURNING id
      `;

      if (updateResult.length > 0) {
        return NextResponse.json({ state });
      }
      
      retries--;
    }

    return NextResponse.json({ error: 'Concurrent update failed' }, { status: 409 });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
