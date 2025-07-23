import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Step 1: Add new columns as nullable first
  await knex.schema.alterTable('games', (table) => {
    table.integer('division_id').nullable();
    table.integer('round_number').nullable();
  });

  // Step 2: Migrate existing data
  await knex.raw(`
    UPDATE games
    SET division_id = r.division_id,
        round_number = r.round_number
    FROM rounds r
    WHERE games.round_id = r.id
  `);

  // Step 3: Make columns NOT NULL and add constraints
  await knex.schema.alterTable('games', (table) => {
    table.integer('division_id').notNullable().alter();
    table.integer('round_number').notNullable().alter();

    // Add foreign key constraint
    table.foreign('division_id').references('id').inTable('divisions').onDelete('CASCADE');

    // Add indexes
    table.index('division_id');
    table.index(['division_id', 'round_number']);
  });

  // Step 3: Drop the old foreign key constraint and round_id column
  await knex.schema.alterTable('games', (table) => {
    table.dropForeign(['round_id']);
    table.dropColumn('round_id');
  });

  // Step 4: Drop the rounds table entirely
  await knex.schema.dropTable('rounds');
}

export async function down(knex: Knex): Promise<void> {
  // Recreate rounds table
  await knex.schema.createTable('rounds', (table) => {
    table.increments('id').primary();
    table.integer('division_id').notNullable().index();
    table.integer('round_number').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('division_id').references('id').inTable('divisions').onDelete('CASCADE');
    table.unique(['division_id', 'round_number']);
  });

  // Recreate round records from games data
  await knex.raw(`
    INSERT INTO rounds (division_id, round_number)
    SELECT DISTINCT division_id, round_number
    FROM games
    ORDER BY division_id, round_number
  `);

  // Add round_id back to games table
  await knex.schema.alterTable('games', (table) => {
    table.integer('round_id').notNullable().index();
  });

  // Populate round_id in games
  await knex.raw(`
    UPDATE games
    SET round_id = r.id
    FROM rounds r
    WHERE games.division_id = r.division_id
    AND games.round_number = r.round_number
  `);

  // Add foreign key constraint back
  await knex.schema.alterTable('games', (table) => {
    table.foreign('round_id').references('id').inTable('rounds').onDelete('CASCADE');
  });

  // Drop the new columns
  await knex.schema.alterTable('games', (table) => {
    table.dropForeign(['division_id']);
    table.dropIndex(['division_id', 'round_number']);
    table.dropColumn('division_id');
    table.dropColumn('round_number');
  });
}