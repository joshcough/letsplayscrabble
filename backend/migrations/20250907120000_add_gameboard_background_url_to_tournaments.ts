import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', table => {
    table.text('gameboard_background_url').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', table => {
    table.dropColumn('gameboard_background_url');
  });
}