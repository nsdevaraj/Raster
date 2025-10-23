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

describe('Metadata Endpoints', () => {
  let app;
  let uploadedImageId;

  beforeEach(async () => {
    app = resetApp();
    const testImagePath = await createTestImageFile(
      path.join(TEST_DIR, 'fixtures', 'test.png'),
      300,
      200,
      'png'
    );

    const uploadResponse = await request(app)
      .post('/api/images/upload')
      .attach('files', testImagePath);

    uploadedImageId = uploadResponse.body.results[0].id;
  });

  describe('GET /api/images', () => {
    it('should list all uploaded images', async () => {
      const response = await request(app)
        .get('/api/images')
        .expect(200);

      expect(response.body).toHaveProperty('images');
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
    });

    it('should return images with complete metadata', async () => {
      const response = await request(app)
        .get('/api/images')
        .expect(200);

      const image = response.body.images[0];
      expect(image).toHaveProperty('id');
      expect(image).toHaveProperty('originalFilename');
      expect(image).toHaveProperty('metadata');
      expect(image.metadata).toHaveProperty('width');
      expect(image.metadata).toHaveProperty('height');
      expect(image.metadata).toHaveProperty('format');
      expect(image.metadata).toHaveProperty('fileSize');
    });

    it('should return images sorted by createdAt descending', async () => {
      const secondImagePath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'test2.png'),
        100,
        100,
        'png'
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .post('/api/images/upload')
        .attach('files', secondImagePath);

      const response = await request(app)
        .get('/api/images')
        .expect(200);

      expect(response.body.images.length).toBeGreaterThanOrEqual(2);
      
      const dates = response.body.images.map((img) => new Date(img.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('GET /api/images/:id', () => {
    it('should retrieve metadata for a specific image', async () => {
      const response = await request(app)
        .get(`/api/images/${uploadedImageId}`)
        .expect(200);

      expect(response.body).toHaveProperty('image');
      expect(response.body.image.id).toBe(uploadedImageId);
      expect(response.body.image.metadata).toHaveProperty('width', 300);
      expect(response.body.image.metadata).toHaveProperty('height', 200);
      expect(response.body.image.metadata).toHaveProperty('format', 'png');
    });

    it('should return 404 for non-existent image', async () => {
      const response = await request(app)
        .get('/api/images/non-existent-id')
        .expect(404);

      expect(response.body.message).toBe('Image not found');
    });

    it('should include file size in metadata', async () => {
      const response = await request(app)
        .get(`/api/images/${uploadedImageId}`)
        .expect(200);

      expect(response.body.image.metadata).toHaveProperty('fileSize');
      expect(typeof response.body.image.metadata.fileSize).toBe('number');
      expect(response.body.image.metadata.fileSize).toBeGreaterThan(0);
    });

    it('should include image dimensions in metadata', async () => {
      const response = await request(app)
        .get(`/api/images/${uploadedImageId}`)
        .expect(200);

      const metadata = response.body.image.metadata;
      expect(metadata).toHaveProperty('width');
      expect(metadata).toHaveProperty('height');
      expect(typeof metadata.width).toBe('number');
      expect(typeof metadata.height).toBe('number');
    });
  });
});
