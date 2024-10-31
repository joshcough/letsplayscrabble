// src/routes/tournaments.js
const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tournaments ORDER BY year DESC, name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single tournament
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get tournament rounds
router.get('/:id/rounds', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM rounds WHERE tournament_id = $1 ORDER BY round_id ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create tournament
router.post('/', async (req, res) => {
  const { name, city, year, lexicon, longFormName, dataUrl } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO tournaments (name, city, year, lexicon, long_form_name, data_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, city, year, lexicon, longFormName, dataUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;