export const WINNING_LINES = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

// Generates a random valid board (1-25 shuffled)
export function generateRandomBoard(): number[] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

// Validates a board
export function validateBoard(board: (number | null)[]): boolean {
  if (board.length !== 25) return false;
  
  const used = new Set<number>();
  
  for (let i = 0; i < 25; i++) {
    const val = board[i];
    if (val === null) return false; // Incomplete
    if (val < 1 || val > 25) return false; // Out of range
    if (used.has(val)) return false; // Duplicate
    used.add(val);
  }
  return true;
}

// Check for bingo
export function getWinningLines(board: number[], calledNumbers: number[]): number[][] {
  const calledSet = new Set(calledNumbers);
  const wins: number[][] = [];
  
  for (const line of WINNING_LINES) {
    if (line.every(index => calledSet.has(board[index]))) {
      wins.push(line);
    }
  }
  
  return wins;
}

export function checkBingo(board: number[], calledNumbers: number[]): boolean {
  return getWinningLines(board, calledNumbers).length > 0;
}
