import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First, check what the current primary key is and drop it
  await knex.schema.alterTable("admin_users", (table) => {
    table.dropPrimary(); // Drop existing primary key (likely on username)
  });

  // Add id column as primary key
  await knex.schema.alterTable("admin_users", (table) => {
    table.increments("id").primary(); // This will be the new primary key
  });

  // Rename the table
  await knex.schema.renameTable("admin_users", "users");

  // Add unique constraint on username (since it's no longer the primary key)
  await knex.schema.alterTable("users", (table) => {
    table.unique(["username"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Rename back
  await knex.schema.renameTable("users", "admin_users");

  // Remove the unique constraint and id column
  await knex.schema.alterTable("admin_users", (table) => {
    table.dropUnique(["username"]);
    table.dropColumn("id");
  });

  // Restore username as primary key
  await knex.schema.alterTable("admin_users", (table) => {
    table.primary(["username"]);
  });
}
