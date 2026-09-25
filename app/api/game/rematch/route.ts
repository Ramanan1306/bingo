import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { roomId, playerId } = await request.json();

    if (!roomId || !playerId) {
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

      if (state.status !== 'WINNER_DETECTED' && state.status !== 'FINISHED' && state.status !== 'REMATCH') {
        return NextResponse.json({ error: 'Game not finished' }, { status: 400 });
      }

      if (!state.rematchRequests) {
        state.rematchRequests = [];
      }

      if (!state.rematchRequests.includes(playerId)) {
        state.rematchRequests.push(playerId);
      }

      if (state.rematchRequests.length === 2) {
        // Both want a rematch
        state.status = 'BOARD_SETUP';
        state.calledNumbers = [];
        state.winner = null;
        state.winningLines = {};
        state.currentTurn = null;
        state.rematchRequests = [];
        for (const pid in state.players) {
          state.players[pid].isReady = false;
        }
      } else {
        state.status = 'REMATCH';
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
    console.error('Rematch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
