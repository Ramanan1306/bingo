import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { roomId, playerName, playerId } = await request.json();

    if (!roomId || !playerName || !playerId) {
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

      if (state.players[playerId]) {
        state.players[playerId].connected = true;
      } else {
        if (Object.keys(state.players).length >= 2) {
          return NextResponse.json({ error: 'ROOM FULL' }, { status: 403 });
        }

        state.players[playerId] = {
          id: playerId,
          name: playerName,
          isReady: false,
          connected: true,
          board: []
        };
        
        if (!state.player1Id) {
          state.player1Id = playerId;
        } else if (!state.player2Id) {
          state.player2Id = playerId;
        }
        
        if (Object.keys(state.players).length === 2) {
          state.status = 'BOARD_SETUP';
        }
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

    return NextResponse.json({ error: 'Concurrent update, please retry' }, { status: 409 });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
