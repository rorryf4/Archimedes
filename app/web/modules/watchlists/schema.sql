-- app/web/modules/watchlists/schema.sql
-- Supabase schema for watchlists persistence

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create watchlist_items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('token', 'market')),
  token_id TEXT,
  market_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure exactly one of token_id or market_id is set based on kind
  CONSTRAINT check_token_or_market CHECK (
    (kind = 'token' AND token_id IS NOT NULL AND market_id IS NULL) OR
    (kind = 'market' AND market_id IS NOT NULL AND token_id IS NULL)
  )
);

-- Create index on watchlist_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- Create index on token_id for faster searches
CREATE INDEX IF NOT EXISTS idx_watchlist_items_token_id ON watchlist_items(token_id) WHERE token_id IS NOT NULL;

-- Create index on market_id for faster searches
CREATE INDEX IF NOT EXISTS idx_watchlist_items_market_id ON watchlist_items(market_id) WHERE market_id IS NOT NULL;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on watchlists table
DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
CREATE TRIGGER update_watchlists_updated_at
  BEFORE UPDATE ON watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
