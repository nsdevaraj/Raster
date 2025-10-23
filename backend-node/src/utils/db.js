const fs = require('fs');
const path = require('path');
const config = require('../config');

let db = null;

async function initDb() {
  if (db) return db;

  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(config.dbPath)) {
    fs.writeFileSync(config.dbPath, JSON.stringify({ images: [] }, null, 2));
  }

  db = {
    data: JSON.parse(fs.readFileSync(config.dbPath, 'utf-8')),
    write: async function() {
      fs.writeFileSync(config.dbPath, JSON.stringify(this.data, null, 2));
    },
    read: async function() {
      this.data = JSON.parse(fs.readFileSync(config.dbPath, 'utf-8'));
    }
  };

  return db;
}

async function getDb() {
  if (!db) {
    await initDb();
  }
  return db;
}

module.exports = { initDb, getDb };
