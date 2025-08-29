import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('cross_tables_head_to_head', (table) => {
    table.string('tourney_name').nullable().after('date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('cross_tables_head_to_head', (table) => {
    table.dropColumn('tourney_name');
  });
}