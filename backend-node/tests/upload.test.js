const request = require('supertest');
const path = require('path');
const { createTestImageFile, createInvalidImageFile } = require('./testUtils');
const { TEST_DIR } = require('./setup');

const resetApp = () => {
  jest.resetModules();
  delete require.cache[require.resolve('../src/config')];
  delete require.cache[require.resolve('../src/services/metadataService')];
  delete require.cache[require.resolve('../src/services/imageService')];
  delete require.cache[require.resolve('../src/middleware/upload')];
  delete require.cache[require.resolve('../src/routes/images')];
  delete require.cache[require.resolve('../src/app')];
  delete require.cache[require.resolve('../src/server')];
  return require('../src/app');
};

describe('Upload Endpoint', () => {
  let app;
  let testImagePath;
  let testImagePath2;
  let invalidImagePath;

  beforeEach(async () => {
    app = resetApp();
    const fixtures = path.join(TEST_DIR, 'fixtures');
    testImagePath = await createTestImageFile(path.join(fixtures, 'test.png'), 200, 200, 'png');
    testImagePath2 = await createTestImageFile(path.join(fixtures, 'test2.jpg'), 150, 150, 'jpeg');
    invalidImagePath = await createInvalidImageFile(path.join(fixtures, 'invalid.txt'));
  });

  describe('POST /api/images/upload', () => {
    it('should upload a single valid image', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', testImagePath)
        .expect(201);

      expect(response.body.message).toBe('Files processed');
      expect(response.body.uploaded).toBe(1);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0]).toHaveProperty('id');
      expect(response.body.results[0]).toHaveProperty('metadata');
      expect(response.body.results[0].metadata).toHaveProperty('width', 200);
      expect(response.body.results[0].metadata).toHaveProperty('height', 200);
      expect(response.body.results[0].metadata).toHaveProperty('format');
    });

    it('should upload multiple images in batch', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', testImagePath)
        .attach('files', testImagePath2)
        .expect(201);

      expect(response.body.uploaded).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
    });

    it('should reject upload without files', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .expect(400);

      expect(response.body.message).toBe('No files uploaded');
    });

    it('should reject invalid file formats', async () => {
      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', invalidImagePath)
        .expect(400);

      expect(response.body.message).toContain('Invalid file type');
    });

    it('should enforce maximum upload count', async () => {
      const fixtures = path.join(TEST_DIR, 'fixtures');
      const files = [];

      for (let i = 0; i < 6; i++) {
        const filePath = await createTestImageFile(
          path.join(fixtures, `test${i}.png`),
          100,
          100,
          'png'
        );
        files.push(filePath);
      }

      const req = request(app).post('/api/images/upload');
      files.forEach((file) => req.attach('files', file));

      const response = await req.expect(400);
      expect(response.body.message).toContain('Too many files');
    });

    it('should handle file size limits', async () => {
      const originalSize = process.env.MAX_FILE_SIZE;
      process.env.MAX_FILE_SIZE = '1000';

      app = resetApp();

      const largeImagePath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'large.png'),
        1024,
        1024,
        'png'
      );

      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', largeImagePath)
        .expect(413);

      expect(response.body.message).toContain('File size exceeds limit');

      process.env.MAX_FILE_SIZE = originalSize;
    });

    it('should support PNG format', async () => {
      const pngPath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'format-test.png'),
        100,
        100,
        'png'
      );

      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', pngPath)
        .expect(201);

      expect(response.body.results[0].metadata.format).toBe('png');
    });

    it('should support JPEG format', async () => {
      const jpgPath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'format-test.jpg'),
        100,
        100,
        'jpeg'
      );

      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', jpgPath)
        .expect(201);

      expect(response.body.results[0].metadata.format).toBe('jpeg');
    });

    it.skip('should support BMP format', async () => {
      const bmpPath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'format-test.bmp'),
        100,
        100,
        'bmp'
      );

      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', bmpPath)
        .expect(201);

      expect(response.body.results.length).toBeGreaterThan(0);
      expect(['bmp', 'dib']).toContain(response.body.results[0].metadata.format);
    });

    it('should support TIFF format', async () => {
      const tiffPath = await createTestImageFile(
        path.join(TEST_DIR, 'fixtures', 'format-test.tiff'),
        100,
        100,
        'tiff'
      );

      const response = await request(app)
        .post('/api/images/upload')
        .attach('files', tiffPath)
        .expect(201);

      expect(response.body.results[0].metadata.format).toBe('tiff');
    });
  });
});
