// migrations/YYYYMMDDHHMMSS_separate_tournament_data.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create the new tournament_data table
  await knex.schema.createTable("tournament_data", (table) => {
    table
      .integer("tournament_id")
      .primary()
      .references("id")
      .inTable("tournaments")
      .onDelete("CASCADE");
    table.text("data_url").notNullable();
    table.json("data").notNullable();
    table.timestamp("poll_until").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Migrate existing data from tournaments table to tournament_data table
  const tournamentsWithData = await knex("tournaments")
    .select("id", "data_url", "data", "poll_until")
    .whereNotNull("data");

  if (tournamentsWithData.length > 0) {
    const tournamentDataRows = tournamentsWithData.map((tournament) => ({
      tournament_id: tournament.id,
      data_url: tournament.data_url,
      data: tournament.data,
      poll_until: tournament.poll_until,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }));

    await knex("tournament_data").insert(tournamentDataRows);
  }

  // Remove the data_url, data and poll_until columns from tournaments table
  await knex.schema.alterTable("tournaments", (table) => {
    table.dropColumn("data_url");
    table.dropColumn("data");
    table.dropColumn("poll_until");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Add the data_url, data and poll_until columns back to tournaments table
  await knex.schema.alterTable("tournaments", (table) => {
    table.text("data_url").notNullable().defaultTo("");
    table.json("data").nullable();
    table.timestamp("poll_until").nullable();
  });

  // Migrate data back from tournament_data to tournaments
  const tournamentDataRows = await knex("tournament_data").select("*");

  for (const row of tournamentDataRows) {
    await knex("tournaments").where("id", row.tournament_id).update({
      data_url: row.data_url,
      data: row.data,
      poll_until: row.poll_until,
    });
  }

  // Drop the tournament_data table
  await knex.schema.dropTable("tournament_data");
}
