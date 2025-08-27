import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Remove confusing tournament context fields from head-to-head games
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    table.dropColumn("tournament_id");
    table.dropColumn("round");
    table.dropColumn("division");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Add back the removed fields if needed to rollback
  await knex.schema.alterTable("cross_tables_head_to_head", (table) => {
    table.integer("tournament_id").notNullable().defaultTo(0);
    table.integer("round");
    table.string("division", 10);
    table.index(["tournament_id"], "idx_h2h_tournament");
  });
}