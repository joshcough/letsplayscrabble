import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create the versions table
  await knex.schema.createTable("tournament_data_versions", (table) => {
    table.increments("id").primary();
    table
      .integer("tournament_id")
      .notNullable()
      .references("id")
      .inTable("tournaments")
      .onDelete("CASCADE");
    table.json("data").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();

    // Index for efficient queries by tournament and time
    table.index(["tournament_id", "created_at"]);
  });

  // Add save_versions flag to tournaments table
  await knex.schema.alterTable("tournaments", (table) => {
    table.boolean("save_versions").notNullable().defaultTo(true);
  });

  // Seed versions table with current data from each tournament
  const tournamentData = await knex("tournament_data").select(
    "tournament_id",
    "data",
    "created_at",
  );

  if (tournamentData.length > 0) {
    const versionRows = tournamentData.map((td) => ({
      tournament_id: td.tournament_id,
      data: td.data,
      created_at: td.created_at, // Use the original created_at timestamp
    }));

    await knex("tournament_data_versions").insert(versionRows);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tournaments", (table) => {
    table.dropColumn("save_versions");
  });
  await knex.schema.dropTable("tournament_data_versions");
}
