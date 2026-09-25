import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const rows = await sql`SELECT state FROM games WHERE id = ${roomId}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const state = rows[0].state;

    // Check if no active movement for 5 minutes
    if (Date.now() - state.updatedAt > 5 * 60 * 1000) {
      await sql`DELETE FROM games WHERE id = ${roomId}`;
      return NextResponse.json({ error: 'Room expired due to inactivity' }, { status: 404 });
    }

    return NextResponse.json({ state: rows[0].state });
  } catch (error) {
    console.error('State fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
