const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const upload = require('../middleware/upload');
const imageService = require('../services/imageService');
const metadataService = require('../services/metadataService');
const config = require('../config');

const router = express.Router();

router.post('/upload', upload.array(config.uploadFieldName, config.maxUploadCount), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const record = await imageService.processUploadedFile(file);
        results.push({
          id: record.id,
          originalFilename: record.originalFilename,
          metadata: record.metadata,
          createdAt: record.createdAt
        });
      } catch (err) {
        errors.push({
          filename: file.originalname,
          error: err.message
        });
      }
    }

    res.status(201).json({
      message: 'Files processed',
      uploaded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const images = await metadataService.listImages();
    res.json({ images });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const image = await metadataService.getImageById(req.params.id);
    if (!image) {
      const error = new Error('Image not found');
      error.name = 'NotFoundError';
      throw error;
    }
    res.json({ image });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/original', async (req, res, next) => {
  try {
    const image = await metadataService.getImageById(req.params.id);
    if (!image) {
      const error = new Error('Image not found');
      error.name = 'NotFoundError';
      throw error;
    }

    const filePath = path.resolve(config.uploadDir, image.originalPath);
    
    try {
      await fs.access(filePath);
    } catch {
      const error = new Error('Image file not found on disk');
      error.name = 'NotFoundError';
      throw error;
    }

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${image.originalFilename}"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/preview', async (req, res, next) => {
  try {
    const image = await metadataService.getImageById(req.params.id);
    if (!image) {
      const error = new Error('Image not found');
      error.name = 'NotFoundError';
      throw error;
    }

    const filePath = path.resolve(config.uploadDir, image.previewPath);
    
    try {
      await fs.access(filePath);
    } catch {
      const error = new Error('Preview image not found on disk');
      error.name = 'NotFoundError';
      throw error;
    }

    res.setHeader('Content-Type', image.previewMimeType || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${image.previewFilename}"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const image = await metadataService.removeImage(req.params.id);
    if (!image) {
      const error = new Error('Image not found');
      error.name = 'NotFoundError';
      throw error;
    }

    await imageService.deleteImageFiles(image);

    res.json({ 
      message: 'Image deleted successfully',
      id: image.id 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
