const sqlite3 = require('sqlite3').verbose();
const dbFile = './selections.db';

// Initialize database and create the selections table if it doesn't exist
function initDb() {
  const db = new sqlite3.Database(dbFile);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tourneyUrl TEXT,
        selectedDivision TEXT,
        player1 TEXT,
        player2 TEXT
      )
    `);
  });

  db.close();
}

// Save the selections (insert or update the only row in the table)
function saveSelections(tourneyUrl, selectedDivision, player1, player2) {
  const db = new sqlite3.Database(dbFile);

  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO selections (id, tourneyUrl, selectedDivision, player1, player2)
      VALUES (1, ?, ?, ?, ?)
    `, [tourneyUrl, selectedDivision, player1, player2], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    db.close();
  });
}

// Get the saved selections
function getSelections() {
  const db = new sqlite3.Database(dbFile);

  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM selections WHERE id = 1`, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });

    db.close();
  });
}

module.exports = { initDb, saveSelections, getSelections };
