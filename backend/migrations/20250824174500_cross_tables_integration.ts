import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Create cross_tables_players table for global player data
  await knex.schema.createTable('cross_tables_players', (table) => {
    table.integer('cross_tables_id').primary();
    table.string('name').notNullable();
    table.integer('twl_rating').nullable();
    table.integer('csw_rating').nullable();
    table.integer('twl_ranking').nullable();
    table.integer('csw_ranking').nullable();
    table.integer('wins').nullable();
    table.integer('losses').nullable();
    table.integer('ties').nullable();
    table.integer('byes').nullable();
    table.string('photo_url').nullable();
    table.string('city').nullable();
    table.string('state').nullable();
    table.string('country').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. Add xtid column to players table
  await knex.schema.alterTable('players', (table) => {
    table.integer('xtid').nullable();
    table.index('xtid');
    // Add foreign key constraint to cross_tables_players
    table.foreign('xtid').references('cross_tables_id').inTable('cross_tables_players');
  });

  // 3. Migrate existing xtid data from etc_data JSONB to the new column
  await knex.raw(`
    UPDATE players 
    SET xtid = (etc_data->>'xtid')::integer 
    WHERE etc_data->>'xtid' IS NOT NULL 
    AND etc_data->>'xtid' != 'null'
    AND etc_data->>'xtid' != ''
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove xtid column and foreign key
  await knex.schema.alterTable('players', (table) => {
    table.dropForeign(['xtid']);
    table.dropColumn('xtid');
  });

  // Drop cross_tables_players table
  await knex.schema.dropTableIfExists('cross_tables_players');
}

