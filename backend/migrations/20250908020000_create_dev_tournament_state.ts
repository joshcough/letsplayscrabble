import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("dev_tournament_state", (table) => {
    table.increments("id").primary();
    table
      .integer("version_id")
      .nullable()
      .references("id")
      .inTable("tournament_data_versions")
      .onDelete("SET NULL");
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();
  });

  // Insert single row (this table should only ever have one row)
  await knex("dev_tournament_state").insert({
    version_id: null,
    updated_at: knex.fn.now(),
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("dev_tournament_state");
}
