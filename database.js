const Database = require('better-sqlite3');
const db = new Database('./warnings.db');

// Create the warnings table if it doesn't exist
db.prepare(`CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player TEXT NOT NULL,
    reasons TEXT NOT NULL,
    date TEXT NOT NULL,
    warn_count INTEGER NOT NULL,
    moderators TEXT,
    dates TEXT
)`).run();

// Vérifier si les colonnes 'moderators' et 'dates' existent
const columns = db.prepare(`PRAGMA table_info(warnings)`).all();
const hasModerators = columns.some(column => column.name === 'moderators');
const hasDates = columns.some(column => column.name === 'dates');

// Ajouter les colonnes 'moderators' et 'dates' si elles n'existent pas
if (!hasModerators) {
    db.prepare(`ALTER TABLE warnings ADD COLUMN moderators TEXT`).run();
}

if (!hasDates) {
    db.prepare(`ALTER TABLE warnings ADD COLUMN dates TEXT`).run();
}

module.exports = db;
