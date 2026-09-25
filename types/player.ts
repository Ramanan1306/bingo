export type Player = {
  id: string; // The UUID of the player (can be generated locally and stored in localStorage)
  name: string;
  isReady: boolean;
  connected: boolean;
  board: number[]; // 1D array of 25 numbers
};
