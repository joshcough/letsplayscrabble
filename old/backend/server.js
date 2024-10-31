const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { initDb, getSelections, saveSelections } = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));

app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, '../frontend/public')));

// Initialize the database and create the table if not exists
initDb();

// POST endpoint to save the tournament URL, selected division, and selected players
app.post('/api/selections', async (req, res) => {
  const { tourneyUrl, selectedDivision, player1, player2 } = req.body;

  try {
    await saveSelections(tourneyUrl, selectedDivision, player1, player2);
    res.status(200).json({ message: 'Selections saved successfully' });
  } catch (error) {
    console.error('Error saving selections:', error);
    res.status(500).json({ error: 'Failed to save selections' });
  }
});

// GET endpoint to retrieve the saved selections
app.get('/api/selections', async (req, res) => {
  try {
    const selections = await getSelections();
    res.status(200).json(selections);
  } catch (error) {
    console.error('Error retrieving selections:', error);
    res.status(500).json({ error: 'Failed to retrieve selections' });
  }
});

//// Fallback to index.html for other routes (for SPA routing)
//app.get('*', (req, res) => {
//    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
//});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
