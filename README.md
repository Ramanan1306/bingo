# Multiplayer Bingo

A polished, real-time multiplayer Bingo web game built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

## Features

- Real-time multiplayer synchronization (2 players)
- Room creation and shareable links
- Interactive Board Setup (Randomize)
- Real-time turn-based gameplay
- Automatic number marking and Bingo detection
- Responsive design for Mobile & Desktop
- Premium aesthetic with Framer Motion animations

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- **Backend/Realtime:** Neon (Serverless Postgres) with short-polling for multiplayer synchronization

## Local Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd multiplayer-bingo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env.local` and add your Supabase credentials.
   ```bash
   cp .env.example .env.local
   ```
   You will need:
   - `DATABASE_URL` (Your Neon Postgres connection string)

4. Database Setup:
   Execute the SQL commands in `schema.sql` in your Neon SQL Editor.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

Deploy this project to Vercel and connect your GitHub repository. Don't forget to set up the environment variables in your Vercel project settings.

## Future Enhancements
- 4-player Bingo
- Private rooms with passwords
- Chat and Reactions
- Leaderboards
