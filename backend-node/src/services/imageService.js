const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const metadataService = require('./metadataService');
const config = require('../config');

const MIME_TYPES = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  bmp: 'image/bmp'
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function ensureWorkspace() {
  await ensureDir(config.uploadDir);
  await ensureDir(config.tmpDir);
  await ensureDir(config.processedDir);
}

async function extractMetadata(filePath) {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  const stats = await fs.stat(filePath);

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    depth: metadata.depth,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    fileSize: stats.size
  };
}

async function generatePreview(originalPath, previewPath, width = config.preview.width) {
  await sharp(originalPath)
    .resize(width, null, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toFile(previewPath);
}

function sanitizeExtension(ext) {
  const cleanExt = ext.replace('.', '').toLowerCase();
  if (['jpeg', 'jpg', 'png', 'tiff', 'tif', 'bmp'].includes(cleanExt)) {
    return cleanExt === 'tif' ? 'tiff' : cleanExt;
  }
  return 'png';
}

async function processUploadedFile(file) {
  await ensureWorkspace();

  const id = uuidv4();
  const originalExt = sanitizeExtension(path.extname(file.originalname) || '');
  const originalFilename = `${id}_original.${originalExt}`;
  const previewFilename = `${id}_preview.jpg`;

  const originalPath = path.join(config.tmpDir, originalFilename);
  const previewPath = path.join(config.processedDir, previewFilename);

  await fs.rename(file.path, originalPath);

  let metadata;
  try {
    metadata = await extractMetadata(originalPath);
    await generatePreview(originalPath, previewPath);
  } catch (err) {
    await fs.unlink(originalPath).catch(() => {});
    throw new Error(`Failed to process image: ${err.message}`);
  }

  const format = metadata.format || originalExt;
  const mimeType = MIME_TYPES[format] || file.mimetype;

  const record = {
    id,
    originalFilename: file.originalname,
    storedFilename: originalFilename,
    previewFilename,
    originalPath: path.relative(config.uploadDir, originalPath),
    previewPath: path.relative(config.uploadDir, previewPath),
    createdAt: new Date().toISOString(),
    mimeType,
    previewMimeType: 'image/jpeg',
    metadata
  };

  await metadataService.addImage(record);
  return record;
}

async function deleteImageFiles(record) {
  const originalFullPath = path.join(config.uploadDir, record.originalPath);
  const previewFullPath = path.join(config.uploadDir, record.previewPath);

  await fs.unlink(originalFullPath).catch(() => {});
  await fs.unlink(previewFullPath).catch(() => {});
}

module.exports = {
  ensureDir,
  ensureWorkspace,
  extractMetadata,
  generatePreview,
  processUploadedFile,
  deleteImageFiles
};
