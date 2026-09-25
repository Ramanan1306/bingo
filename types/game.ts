import { Player } from './player';

export type GameStatus = 
  | 'WAITING_FOR_PLAYERS' 
  | 'BOARD_SETUP' 
  | 'WAITING_FOR_READY' 
  | 'COUNTDOWN' 
  | 'PLAYING' 
  | 'WINNER_DETECTED' 
  | 'FINISHED' 
  | 'REMATCH';

export type Turn = 'PLAYER_1' | 'PLAYER_2';

export interface EmojiMessage {
  id: string;
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  status: GameStatus;
  players: Record<string, Player>; // playerId -> Player
  player1Id: string | null; // The creator of the room
  player2Id: string | null; // The second person who joined
  currentTurn: Turn | null;
  calledNumbers: number[];
  winner: string | 'DRAW' | null; // playerId or DRAW
  winningLines: Record<string, number[][]>; // playerId -> array of winning lines (each line is array of indices)
  rematchRequests: string[]; // array of playerIds who want a rematch
  messages?: EmojiMessage[]; // chat messages
  createdAt: number;
  updatedAt: number;
}
