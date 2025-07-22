import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Drop the existing table entirely - we can't migrate the data anyway since we don't know which user it belongs to
  await knex.schema.dropTableIfExists('current_matches');

  // Recreate the table with the new schema
  await knex.schema.createTable('current_matches', (table) => {
    table.integer('user_id').references('id').inTable('users').primary();
    table.integer('tournament_id').references('id').inTable('tournaments').notNullable();
    table.integer('division_id').notNullable();
    table.integer('round').notNullable();
    table.integer('pairing_id').notNullable();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    
    // Add indexes for performance
    table.index('user_id');
    table.index('tournament_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop the new table
  await knex.schema.dropTableIfExists('current_matches');
  
  // Recreate the old single-row table
  await knex.schema.createTable('current_matches', (table) => {
    table.integer('id').primary().defaultTo(1);
    table.integer('tournament_id').references('id').inTable('tournaments');
    table.integer('division_id');
    table.integer('round');
    table.integer('pairing_id');
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.check('id = 1');
  });
}