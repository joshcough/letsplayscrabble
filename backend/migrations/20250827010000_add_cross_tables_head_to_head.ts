import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create cross_tables_head_to_head table to store H2H game data
  await knex.schema.createTable("cross_tables_head_to_head", (table) => {
    table.increments("id").primary();
    
    // Cross-tables game identifiers
    table.integer("game_id").notNullable().unique(); // from cross-tables API
    table.integer("tournament_id").notNullable(); // cross-tables tournament ID
    table.date("date");
    table.integer("round");
    table.string("division", 10);
    
    // Winner data
    table.integer("winner_id").notNullable(); // cross-tables player ID
    table.string("winner_name", 255);
    table.integer("winner_score");
    table.integer("winner_old_rating");
    table.integer("winner_new_rating");
    table.integer("winner_position");
    
    // Loser data  
    table.integer("loser_id").notNullable(); // cross-tables player ID
    table.string("loser_name", 255);
    table.integer("loser_score");
    table.integer("loser_old_rating");
    table.integer("loser_new_rating");
    table.integer("loser_position");
    
    // Game replay URL
    table.text("annotated");
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes for efficient querying
    table.index(["winner_id", "loser_id"], "idx_h2h_players");
    table.index(["tournament_id"], "idx_h2h_tournament");
    table.index(["date"], "idx_h2h_date");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("cross_tables_head_to_head");
}