import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Rename winner/loser columns to player1/player2 to handle ties properly
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    // Rename winner columns to player1
    table.renameColumn("winner_id", "player1_id");
    table.renameColumn("winner_name", "player1_name");
    table.renameColumn("winner_score", "player1_score");
    table.renameColumn("winner_old_rating", "player1_old_rating");
    table.renameColumn("winner_new_rating", "player1_new_rating");
    table.renameColumn("winner_position", "player1_position");
    
    // Rename loser columns to player2
    table.renameColumn("loser_id", "player2_id");
    table.renameColumn("loser_name", "player2_name");
    table.renameColumn("loser_score", "player2_score");
    table.renameColumn("loser_old_rating", "player2_old_rating");
    table.renameColumn("loser_new_rating", "player2_new_rating");
    table.renameColumn("loser_position", "player2_position");
  });
  
  // Update the index to use new column names
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    table.dropIndex(["winner_id", "loser_id"], "idx_h2h_players");
    table.index(["player1_id", "player2_id"], "idx_h2h_players");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Rollback: rename player1/player2 back to winner/loser
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    table.dropIndex(["player1_id", "player2_id"], "idx_h2h_players");
    table.index(["winner_id", "loser_id"], "idx_h2h_players");
  });
  
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    // Rename player1 columns back to winner
    table.renameColumn("player1_id", "winner_id");
    table.renameColumn("player1_name", "winner_name");
    table.renameColumn("player1_score", "winner_score");
    table.renameColumn("player1_old_rating", "winner_old_rating");
    table.renameColumn("player1_new_rating", "winner_new_rating");
    table.renameColumn("player1_position", "winner_position");
    
    // Rename player2 columns back to loser
    table.renameColumn("player2_id", "loser_id");
    table.renameColumn("player2_name", "loser_name");
    table.renameColumn("player2_score", "loser_score");
    table.renameColumn("player2_old_rating", "loser_old_rating");
    table.renameColumn("player2_new_rating", "loser_new_rating");
    table.renameColumn("player2_position", "loser_position");
  });
}