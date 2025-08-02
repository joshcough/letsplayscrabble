import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add unique constraint to games table
  await knex.schema.alterTable("games", (table) => {
    table.unique(["division_id", "round_number", "pairing_id"], {
      indexName: "games_unique_key",
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  // Remove the unique constraint
  await knex.schema.alterTable("games", (table) => {
    table.dropUnique(
      ["division_id", "round_number", "pairing_id"],
      "games_unique_key",
    );
  });
}
