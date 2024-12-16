CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  lexicon VARCHAR(255) NOT NULL,
  long_form_name VARCHAR(255) NOT NULL,
  data_url TEXT NOT NULL,
  data json NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  poll_until TIMESTAMP
);

CREATE TABLE current_matches (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Ensures only one current match
    tournament_id INTEGER REFERENCES tournaments(id),
    division_id INTEGER,
    round INTEGER,
    pairing_id INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_current_matches_updated_at
    BEFORE UPDATE ON current_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE admin_users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL
);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scrabble_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scrabble_user;
