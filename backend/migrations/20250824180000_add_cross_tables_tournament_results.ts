import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add tournament_results JSON field to store detailed tournament history
  await knex.schema.alterTable('cross_tables_players', (table) => {
    table.json('tournament_results').nullable();
    table.integer('tournament_count').nullable(); // Cached count for performance
    table.decimal('average_score', 5, 1).nullable(); // Cached average score for performance
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('cross_tables_players', (table) => {
    table.dropColumn('tournament_results');
    table.dropColumn('tournament_count');
    table.dropColumn('average_score');
  });
}