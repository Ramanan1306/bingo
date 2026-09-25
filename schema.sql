-- Create the games table
CREATE TABLE IF NOT EXISTS games (
  id text PRIMARY KEY,
  version integer NOT NULL DEFAULT 1,
  state jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
