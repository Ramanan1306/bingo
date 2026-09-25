import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';
import { checkBingo, getWinningLines } from '@/lib/bingoLogic';

export async function POST(request: Request) {
  try {
    const { roomId, playerId, number } = await request.json();

    if (!roomId || !playerId || typeof number !== 'number') {
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

      if (state.status === 'COUNTDOWN') {
        state.status = 'PLAYING';
      }

      if (state.status !== 'PLAYING') {
        return NextResponse.json({ error: 'Game is not in playing state' }, { status: 400 });
      }

      const isPlayer1 = state.player1Id === playerId;
      const isPlayer2 = state.player2Id === playerId;

      if (!isPlayer1 && !isPlayer2) {
        return NextResponse.json({ error: 'Player not in game' }, { status: 403 });
      }

      const expectedTurn = isPlayer1 ? 'PLAYER_1' : 'PLAYER_2';
      if (state.currentTurn !== expectedTurn) {
        return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
      }

      if (state.calledNumbers.includes(number)) {
        return NextResponse.json({ error: 'Number already called' }, { status: 400 });
      }

      // Valid call
      state.calledNumbers.push(number);

      // Check for bingo
      let p1Bingo = false;
      let p2Bingo = false;

      if (state.player1Id) {
        const lines = getWinningLines(state.players[state.player1Id].board, state.calledNumbers);
        state.winningLines[state.player1Id] = lines;
        if (lines.length >= 5) {
          p1Bingo = true;
        }
      }

      if (state.player2Id) {
        const lines = getWinningLines(state.players[state.player2Id].board, state.calledNumbers);
        state.winningLines[state.player2Id] = lines;
        if (lines.length >= 5) {
          p2Bingo = true;
        }
      }

      if (p1Bingo && p2Bingo) {
        state.status = 'WINNER_DETECTED';
        state.winner = 'DRAW';
      } else if (p1Bingo) {
        state.status = 'WINNER_DETECTED';
        state.winner = state.player1Id;
      } else if (p2Bingo) {
        state.status = 'WINNER_DETECTED';
        state.winner = state.player2Id;
      } else {
        // Switch turn
        state.currentTurn = state.currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
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
    console.error('Call error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
