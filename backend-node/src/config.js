const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const projectRoot = path.resolve(__dirname, '..');

const resolvePath = (targetPath) => {
  if (!targetPath) {
    return undefined;
  }
  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }
  return path.resolve(projectRoot, targetPath);
};

const uploadBaseDir = resolvePath(process.env.UPLOAD_DIR || './storage');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(25 * 1024 * 1024), 10),
  uploadDir: uploadBaseDir,
  tmpDir: path.join(uploadBaseDir, 'tmp'),
  processedDir: path.join(uploadBaseDir, 'processed'),
  dbPath: resolvePath(process.env.DB_PATH || './data/db.json'),
  uploadFieldName: process.env.UPLOAD_FIELD_NAME || 'files',
  maxUploadCount: parseInt(process.env.MAX_UPLOAD_COUNT || '10', 10),
  preview: {
    width: parseInt(process.env.PREVIEW_WIDTH || '480', 10)
  }
};
