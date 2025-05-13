const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DATABASE_PATH || './server/database/conversations.db');
const db = new sqlite3.Database(dbPath);

// Save a conversation message
function saveConversation(userId, message, role) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO conversations (user_id, message, role) VALUES (?, ?, ?)');
    stmt.run(userId, message, role, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Get conversation history for a user
function getConversationHistory(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM conversations WHERE user_id = ? ORDER BY timestamp ASC', [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Save uploaded file information
function saveUploadedFile(userId, filename, contentMarkdown) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('INSERT INTO uploaded_files (user_id, filename, content_markdown) VALUES (?, ?, ?)');
    stmt.run(userId, filename, contentMarkdown, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
}

// Get uploaded files for a user
function getUploadedFiles(userId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM uploaded_files WHERE user_id = ? ORDER BY timestamp DESC', [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  saveConversation,
  getConversationHistory,
  saveUploadedFile,
  getUploadedFiles
};