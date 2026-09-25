import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';
import { validateBoard } from '@/lib/bingoLogic';

export async function POST(request: Request) {
  try {
    const { roomId, playerId, board } = await request.json();

    if (!roomId || !playerId || !board) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }

    if (!validateBoard(board)) {
      return NextResponse.json({ error: 'Invalid board configuration' }, { status: 400 });
    }

    let retries = 3;
    while (retries > 0) {
      const rows = await sql`SELECT state, version FROM games WHERE id = ${roomId}`;

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const state = rows[0].state as GameState;
      const version = rows[0].version;

      if (!state.players[playerId]) {
        return NextResponse.json({ error: 'Player not in room' }, { status: 403 });
      }
      
      if (state.status !== 'BOARD_SETUP' && state.status !== 'WAITING_FOR_READY') {
        return NextResponse.json({ error: 'Cannot change ready state now' }, { status: 400 });
      }

      state.players[playerId].board = board;
      state.players[playerId].isReady = true;

      // Check if both ready
      const players = Object.values(state.players);
      if (players.length === 2 && players.every(p => p.isReady)) {
        state.status = 'COUNTDOWN';
        state.currentTurn = 'PLAYER_1';
      } else {
        state.status = 'WAITING_FOR_READY';
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
    console.error('Ready error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
