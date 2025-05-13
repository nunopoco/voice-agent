const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DATABASE_PATH || './server/database/conversations.db');

function initializeDatabase() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('Connected to the SQLite database.');
    
    // Create conversations table
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      message TEXT NOT NULL,
      role TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating conversations table:', err.message);
      } else {
        console.log('Conversations table created or already exists.');
      }
    });
    
    // Create uploaded_files table
    db.run(`CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating uploaded_files table:', err.message);
      } else {
        console.log('Uploaded_files table created or already exists.');
      }
    });
  });
  
  return db;
}

module.exports = { initializeDatabase };