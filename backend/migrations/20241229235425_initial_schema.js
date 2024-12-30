/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('tournaments', table => {
      table.increments('id');
      table.string('name', 255).notNullable();
      table.string('city', 255).notNullable();
      table.integer('year').notNullable();
      table.string('lexicon', 255).notNullable();
      table.string('long_form_name', 255).notNullable();
      table.text('data_url').notNullable();
      table.json('data').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('poll_until', { useTz: false });
    })
    .createTable('current_matches', table => {
      table.integer('id').primary().checkIn([1]);  // Enforces id = 1
      table.integer('tournament_id').references('id').inTable('tournaments');
      table.integer('division_id');
      table.integer('round');
      table.integer('pairing_id');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('admin_users', table => {
      table.string('username', 50).primary();
      table.string('password_hash', 255).notNullable();
    })
    .raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)
    .raw(`
      CREATE TRIGGER update_tournaments_updated_at
      BEFORE UPDATE ON tournaments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.resolve();
};
