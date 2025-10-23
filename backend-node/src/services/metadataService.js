const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const config = require('../config');

let cache = null;

async function ensureDb() {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(config.dbPath)) {
    await fsp.writeFile(config.dbPath, JSON.stringify({ images: [] }, null, 2));
  }
}

async function loadDb() {
  if (cache) {
    return cache;
  }

  await ensureDb();
  const raw = await fsp.readFile(config.dbPath, 'utf-8');
  cache = raw ? JSON.parse(raw) : { images: [] };
  cache.images = cache.images || [];
  return cache;
}

async function saveDb(data) {
  cache = data;
  await ensureDb();
  await fsp.writeFile(config.dbPath, JSON.stringify(cache, null, 2));
  return cache;
}

async function initialize() {
  cache = null;
  await loadDb();
}

async function addImage(record) {
  const db = await loadDb();
  db.images.push(record);
  await saveDb(db);
  return record;
}

async function listImages() {
  const db = await loadDb();
  return [...db.images].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getImageById(id) {
  const db = await loadDb();
  return db.images.find((image) => image.id === id) || null;
}

async function removeImage(id) {
  const db = await loadDb();
  const index = db.images.findIndex((image) => image.id === id);
  if (index === -1) {
    return null;
  }
  const [removed] = db.images.splice(index, 1);
  await saveDb(db);
  return removed;
}

module.exports = {
  initialize,
  addImage,
  listImages,
  getImageById,
  removeImage
};
