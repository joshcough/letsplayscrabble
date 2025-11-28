import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First, update any NULL values to defaults
  await knex('tournaments')
    .whereNull('theme')
    .update({ theme: 'scrabble' });

  await knex('tournaments')
    .whereNull('transparent_background')
    .update({ transparent_background: false });

  // Then alter the columns to be NOT NULL with defaults
  await knex.schema.alterTable('tournaments', table => {
    table.string('theme').notNullable().defaultTo('scrabble').alter();
    table.boolean('transparent_background').notNullable().defaultTo(false).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert to nullable columns
  await knex.schema.alterTable('tournaments', table => {
    table.string('theme').nullable().alter();
    table.boolean('transparent_background').nullable().alter();
  });
}
