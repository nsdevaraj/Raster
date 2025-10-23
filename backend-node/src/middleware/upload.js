const fs = require('fs');
const multer = require('multer');
const path = require('path');
const config = require('../config');

fs.mkdirSync(config.tmpDir, { recursive: true });

const ALLOWED_MIMES = [
  'image/png',
  'image/jpeg',
  'image/bmp',
  'image/tiff'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.tmpDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeValid = ALLOWED_MIMES.includes(file.mimetype);
  const extValid = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeValid && extValid) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed formats: PNG, JPG, BMP, TIFF`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize
  }
});

module.exports = upload;
