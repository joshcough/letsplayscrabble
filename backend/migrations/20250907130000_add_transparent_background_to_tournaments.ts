import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', table => {
    table.boolean('transparent_background').nullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', table => {
    table.dropColumn('transparent_background');
  });
}