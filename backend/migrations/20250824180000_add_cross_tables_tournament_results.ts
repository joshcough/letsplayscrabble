import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add tournament_results JSON field to store detailed tournament history
  await knex.schema.alterTable('cross_tables_players', (table) => {
    table.json('tournament_results').nullable();
    table.integer('tournament_count').nullable(); // Cached count for performance
    table.decimal('average_score', 5, 1).nullable(); // Cached average score for performance
    table.decimal('opponent_average_score', 5, 1).nullable(); // Cached opponent average score
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('cross_tables_players', (table) => {
    table.dropColumn('tournament_results');
    table.dropColumn('tournament_count');
    table.dropColumn('average_score');
  });
  
  // Check if opponent_average_score exists before dropping it
  const hasColumn = await knex.schema.hasColumn('cross_tables_players', 'opponent_average_score');
  if (hasColumn) {
    await knex.schema.alterTable('cross_tables_players', (table) => {
      table.dropColumn('opponent_average_score');
    });
  }
}