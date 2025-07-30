import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add the column as nullable first
  await knex.schema.alterTable("tournaments", (table) => {
    table.integer("user_id").references("id").inTable("users");
  });

  // Set all existing tournaments to user_id = 1
  await knex("tournaments").update({ user_id: 1 });

  // Now make it not null and add index
  await knex.schema.alterTable("tournaments", (table) => {
    table.integer("user_id").notNullable().alter();
    table.index("user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tournaments", (table) => {
    table.dropIndex("user_id");
    table.dropColumn("user_id");
  });
}
