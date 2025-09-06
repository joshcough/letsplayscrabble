import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', (table) => {
    table.string('theme').nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tournaments', (table) => {
    table.dropColumn('theme');
  });
}