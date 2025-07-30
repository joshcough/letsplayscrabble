import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create tournaments table
  await knex.schema.createTable("tournaments", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("city", 255).notNullable();
    table.integer("year").notNullable();
    table.string("lexicon", 255).notNullable();
    table.string("long_form_name", 255).notNullable();
    table.text("data_url").notNullable();
    table.json("data").notNullable();
    table.timestamp("created_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp("poll_until", { useTz: true }).nullable();
  });

  // Create current_matches table
  await knex.schema.createTable("current_matches", (table) => {
    table.integer("id").primary().defaultTo(1);
    table.integer("tournament_id").references("id").inTable("tournaments");
    table.integer("division_id");
    table.integer("round");
    table.integer("pairing_id");
    table.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());

    // Add check constraint for single row
    table.check("id = 1");
  });

  // Create admin_users table
  await knex.schema.createTable("admin_users", (table) => {
    table.string("username", 50).primary();
    table.string("password_hash", 255).notNullable();
  });

  // Create update_updated_at_column function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  // Create triggers
  await knex.raw(`
    CREATE TRIGGER update_current_matches_updated_at
        BEFORE UPDATE ON current_matches
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  await knex.raw(`
    CREATE TRIGGER update_tournaments_updated_at
        BEFORE UPDATE ON tournaments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Grant privileges (assuming scrabble_user exists)
  await knex.raw(
    "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scrabble_user",
  );
  await knex.raw(
    "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scrabble_user",
  );
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw(
    "DROP TRIGGER IF EXISTS update_tournaments_updated_at ON tournaments",
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS update_current_matches_updated_at ON current_matches",
  );

  // Drop function
  await knex.raw("DROP FUNCTION IF EXISTS update_updated_at_column()");

  // Drop tables in reverse order
  await knex.schema.dropTableIfExists("admin_users");
  await knex.schema.dropTableIfExists("current_matches");
  await knex.schema.dropTableIfExists("tournaments");
}
