export const migrationSql = `
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS simulation_snapshot JSONB;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS last_write_token UUID;
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS simulation_id UUID;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS peer_trades_by_round JSONB NOT NULL DEFAULT '{}';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS simulation_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gross_total NUMERIC(12,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS commission_percent NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS display_timestamp TEXT;
ALTER TABLE direct_sell_offers ADD COLUMN IF NOT EXISTS simulation_id UUID;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS simulation_id UUID;
ALTER TABLE direct_sell_offers ADD COLUMN IF NOT EXISTS round_number INTEGER;
ALTER TABLE swap_offers ADD COLUMN IF NOT EXISTS round_number INTEGER;
`;
