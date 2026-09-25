import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { GameState } from '@/types/game';

export async function POST(request: Request) {
  try {
    const { roomId, playerId } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }

    const rows = await sql`SELECT state FROM games WHERE id = ${roomId}`;

    if (rows.length === 0) {
      return NextResponse.json({ success: true }); // already deleted or doesn't exist
    }

    const state = rows[0].state as GameState;

    // Delete the entire room if a player leaves
    if (state.player1Id === playerId || state.player2Id === playerId) {
      await sql`DELETE FROM games WHERE id = ${roomId}`;
      return NextResponse.json({ success: true });
    } else {
      // Player wasn't in this game anyway
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Leave error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
