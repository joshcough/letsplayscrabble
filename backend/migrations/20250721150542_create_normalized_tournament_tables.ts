import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create divisions table
  await knex.schema.createTable('divisions', (table) => {
    table.increments('id').primary();
    table.integer('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE').notNullable();
    table.string('name', 255).notNullable();
    table.integer('position').notNullable(); // order within tournament
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['tournament_id', 'position']);
    table.index('tournament_id');
  });

  // Create tournament_players table (scoped to tournament)
  await knex.schema.createTable('tournament_players', (table) => {
    table.increments('id').primary();
    table.integer('tournament_id').references('id').inTable('tournaments').onDelete('CASCADE').notNullable();
    table.integer('division_id').references('id').inTable('divisions').onDelete('CASCADE').notNullable();
    table.integer('player_id').notNullable(); // ID within tournament file
    table.string('name', 255).notNullable();
    table.integer('initial_rating').defaultTo(0);
    table.text('photo').nullable();
    table.jsonb('etc_data').nullable(); // Store the Etc object
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['tournament_id', 'division_id', 'player_id']);
    table.index(['tournament_id', 'division_id']);
    table.index(['tournament_id', 'player_id']);
  });

  // Create rounds table
  await knex.schema.createTable('rounds', (table) => {
    table.increments('id').primary();
    table.integer('division_id').references('id').inTable('divisions').onDelete('CASCADE').notNullable();
    table.integer('round_number').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['division_id', 'round_number']);
    table.index('division_id');
  });

  // Create games table
  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table.integer('round_id').references('id').inTable('rounds').onDelete('CASCADE').notNullable();
    table.integer('player1_id').references('id').inTable('tournament_players').onDelete('CASCADE').notNullable();
    table.integer('player2_id').references('id').inTable('tournament_players').onDelete('CASCADE').notNullable();
    table.integer('player1_score').nullable();
    table.integer('player2_score').nullable();
    table.boolean('is_bye').defaultTo(false);
    table.integer('pairing_id').nullable(); // For ordering within round
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index('round_id');
    table.index(['player1_id', 'player2_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order due to foreign key constraints
  await knex.schema.dropTableIfExists('games');
  await knex.schema.dropTableIfExists('rounds');
  await knex.schema.dropTableIfExists('tournament_players');
  await knex.schema.dropTableIfExists('divisions');
}