const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, '.test-data');

beforeEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  process.env.NODE_ENV = 'test';
  process.env.UPLOAD_DIR = path.join(TEST_DIR, 'storage');
  process.env.DB_PATH = path.join(TEST_DIR, 'db.json');
  process.env.PORT = '3099';
  process.env.MAX_UPLOAD_COUNT = '5';
});

afterAll(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

module.exports = {
  TEST_DIR
};
