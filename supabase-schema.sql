-- ============================================================
--  Team Yurâm — Supabase Schema
--  Exécuter dans : Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tournois internes
CREATE TABLE IF NOT EXISTS tournaments (
  id             TEXT PRIMARY KEY,
  date           TEXT NOT NULL,
  organizer      TEXT NOT NULL DEFAULT '',
  num_rounds     INTEGER NOT NULL DEFAULT 4,
  has_playoffs   BOOLEAN NOT NULL DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'pending',
  current_round  INTEGER NOT NULL DEFAULT 0,
  players        JSONB NOT NULL DEFAULT '[]',
  swiss_rounds   JSONB NOT NULL DEFAULT '[]',
  playoffs       JSONB,
  decks          JSONB NOT NULL DEFAULT '{}',
  season_points  JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Entraînements
CREATE TABLE IF NOT EXISTS trainings (
  id         TEXT PRIMARY KEY,
  date       TEXT NOT NULL,
  present    JSONB NOT NULL DEFAULT '[]',
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tournois externes
CREATE TABLE IF NOT EXISTS external_tournaments (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL,
  location   TEXT NOT NULL DEFAULT '',
  members    JSONB NOT NULL DEFAULT '[]',
  decks      JSONB NOT NULL DEFAULT '{}',
  results    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Historique des saisons passées
CREATE TABLE IF NOT EXISTS history (
  year     INTEGER PRIMARY KEY,
  champion TEXT NOT NULL DEFAULT '',
  ranking  JSONB NOT NULL DEFAULT '[]',
  note     TEXT NOT NULL DEFAULT ''
);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Lecture publique + écriture avec la clé anon (contrôle d'accès géré côté app)

ALTER TABLE tournaments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE history             ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire et écrire (le PIN admin gère l'accès côté app)
CREATE POLICY "public_all" ON tournaments          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON trainings            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON external_tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON history              FOR ALL USING (true) WITH CHECK (true);

-- ── Activer Realtime ────────────────────────────────────────────────────────
-- Dans le dashboard : Database → Replication → cocher tournaments, trainings, external_tournaments, history
-- OU via SQL :
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE trainings;
ALTER PUBLICATION supabase_realtime ADD TABLE external_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE history;
