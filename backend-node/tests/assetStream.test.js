const request = require('supertest');
const path = require('path');
const { createTestImageFile } = require('./testUtils');
const { TEST_DIR } = require('./setup');

const resetApp = () => {
  jest.resetModules();
  delete require.cache[require.resolve('../src/config')];
  delete require.cache[require.resolve('../src/services/metadataService')];
  delete require.cache[require.resolve('../src/services/imageService')];
  delete require.cache[require.resolve('../src/middleware/upload')];
  delete require.cache[require.resolve('../src/routes/images')];
  delete require.cache[require.resolve('../src/app')];
  return require('../src/app');
};

describe('Asset Streaming Endpoints', () => {
  let app;
  let imageId;

  beforeEach(async () => {
    app = resetApp();
    const testImagePath = await createTestImageFile(
      path.join(TEST_DIR, 'fixtures', 'stream.png'),
      250,
      150,
      'png'
    );

    const uploadResponse = await request(app)
      .post('/api/images/upload')
      .attach('files', testImagePath)
      .expect(201);

    if (!uploadResponse.body.results || uploadResponse.body.results.length === 0) {
      console.log('Upload in assetStream beforeEach failed:', uploadResponse.body);
    }

    imageId = uploadResponse.body.results[0]?.id;
  });

  describe('GET /api/images/:id/original', () => {
    it('should stream the original image asset', async () => {
      const url = `/api/images/${imageId}/original`;
      console.log('Requesting original path', url);
      const response = await request(app)
        .get(url);

      if (response.status !== 200) {
        console.log('Original stream response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/image\/(png|jpeg|bmp|tiff)/);
      expect(response.headers['content-disposition']).toMatch(/inline/);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 404 when original file is missing', async () => {
      const fs = require('fs');
      const path = require('path');
      const config = require('../src/config');
      
      const metadataService = require('../src/services/metadataService');
      const image = await metadataService.getImageById(imageId);
      const originalPath = path.join(config.uploadDir, image.originalPath);
      fs.unlinkSync(originalPath);

      const response = await request(app)
        .get(`/api/images/${imageId}/original`)
        .expect(404);

      expect(response.body.message).toContain('Image file not found');
    });
  });

  describe('GET /api/images/:id/preview', () => {
    it('should stream the preview asset', async () => {
      const response = await request(app)
        .get(`/api/images/${imageId}/preview`)
        .expect(200);

      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['content-disposition']).toMatch(/inline/);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 404 when preview file is missing', async () => {
      const fs = require('fs');
      const path = require('path');
      const config = require('../src/config');
      const metadataService = require('../src/services/metadataService');
      const image = await metadataService.getImageById(imageId);
      const previewPath = path.join(config.uploadDir, image.previewPath);
      fs.unlinkSync(previewPath);

      const response = await request(app)
        .get(`/api/images/${imageId}/preview`)
        .expect(404);

      expect(response.body.message).toContain('Preview image not found');
    });
  });

  describe('DELETE /api/images/:id', () => {
    it('should delete image metadata and files', async () => {
      const response = await request(app)
        .delete(`/api/images/${imageId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Image deleted successfully');

      await request(app)
        .get(`/api/images/${imageId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent image', async () => {
      const response = await request(app)
        .delete('/api/images/non-existent')
        .expect(404);

      expect(response.body.message).toBe('Image not found');
    });
  });
});
