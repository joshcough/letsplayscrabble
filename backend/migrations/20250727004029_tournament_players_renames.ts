import type { Knex } from "knex";

exports.up = function (knex) {
  return knex.schema.renameTable("tournament_players", "players").then(() => {
    return knex.schema.alterTable("players", (table) => {
      table.renameColumn("player_id", "seed");
    });
  });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable("players", (table) => {
      table.renameColumn("seed", "player_id");
    })
    .then(() => {
      return knex.schema.renameTable("players", "tournament_players");
    });
};
