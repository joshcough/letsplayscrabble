const { processTournament } = require("../services/dataProcessing");

class TournamentRepository {
  constructor(db) { this.db = db; }

  async create({ name, city, year, lexicon, longFormName, dataUrl, rawData }) {
    const result = await this.db.query(
      `INSERT INTO tournaments (name, city, year, lexicon, long_form_name, data_url, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, city, year, lexicon, longFormName, dataUrl, rawData]
    );
    return await processTournament(result.rows[0]);
  }

  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );
    return processTournament(result.rows[0]);
  }

  async findByName(name) {
    const result = await this.db.query(
      'SELECT * FROM tournaments WHERE name = $1',
      [name]
    );
    return processTournament(result.rows[0]);
  }

  async findAllNames() {
    const result = await this.db.query(
      'SELECT id, name FROM tournaments ORDER BY name ASC',
      [name]
    );
    return result.rows;
  }

  async findAll() {
    const result = await this.db.query('SELECT * FROM tournaments');
    return await Promise.all(result.rows.map(t => processTournament(t)));
  }

  async findPlayerStats(tournamentId, divisionId, playerId) {
    const tourney = await this.findById(tournamentId)
    const standings = tourney.standings[divisionId];
    return standings[playerId-1];
  }
}

module.exports = TournamentRepository;