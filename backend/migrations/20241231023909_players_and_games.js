/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable('players', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
        })
        .createTable('games', table => {
            table.increments('id').primary();
            table.integer('tournament_id').notNullable()
                .references('id').inTable('tournaments')
                .onDelete('RESTRICT');
            table.integer('round_id').notNullable();

            // Player 1 information
            table.integer('player1_id').notNullable()
                .references('id').inTable('players')
                .onDelete('RESTRICT');
            table.integer('player1_rating').notNullable();
            table.integer('player1_score').notNullable();
            table.boolean('player1_first_move').notNullable();
            table.integer('player1_rank').notNullable();

            // Player 2 information
            table.integer('player2_id').notNullable()
                .references('id').inTable('players')
                .onDelete('RESTRICT');
            table.integer('player2_rating').notNullable();
            table.integer('player2_score').notNullable();
            table.boolean('player2_first_move').notNullable();
            table.integer('player2_rank').notNullable();

            // Add indexes for common queries
            table.index(['tournament_id', 'round_id']);
            table.index('player1_id');
            table.index('player2_id');
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTableIfExists('games')
        .dropTableIfExists('players');
};