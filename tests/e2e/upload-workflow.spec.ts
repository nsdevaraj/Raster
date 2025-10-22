import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Image Upload to Export Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Image to SVG Converter');
  });

  test('should display the upload interface', async ({ page }) => {
    await expect(page.locator('.file-label')).toBeVisible();
    await expect(page.locator('.convert-button')).toBeVisible();
    await expect(page.locator('.convert-button')).toBeDisabled();
  });

  test('should enable convert button after file selection', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await expect(page.locator('.file-label')).toContainText('test-image.png');
    await expect(page.locator('.convert-button')).toBeEnabled();
  });

  test('should successfully convert image to SVG', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.convert-button')).toContainText('Processing...');
    
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 30000 });
    
    await expect(page.locator('svg')).toBeVisible();
    
    await expect(page.locator('.download-button')).toBeVisible();
  });

  test('should display processing time after conversion', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.info-message')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.info-message')).toContainText('Processing time');
  });

  test('should allow downloading the SVG', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.download-button')).toBeVisible({ timeout: 30000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.download-button').click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
  });

  test('should work with different conversion options', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('input[type="checkbox"]').first().uncheck();
    
    await page.locator('#color-mode').selectOption('grayscale');
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should support streaming mode', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/large-image.png'));
    
    const streamingCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Streaming mode' });
    await streamingCheckbox.check();
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 60000 });
  });

  test('should support background processing', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    const backgroundCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Background processing' });
    await backgroundCheckbox.check();
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.info-message')).toContainText('Task ID', { timeout: 5000 });
    
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 60000 });
  });

  test('should handle errors gracefully', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    const invalidFile = Buffer.from('invalid image data');
    await fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: invalidFile,
    });
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 });
  });

  test('should use cache on repeated conversions', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    const testFile = path.join(__dirname, '../fixtures/test-image.png');
    
    await fileInput.setInputFiles(testFile);
    await page.locator('.convert-button').click();
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 30000 });
    
    const firstProcessingTime = await page.locator('.info-message').textContent();
    
    await page.reload();
    await fileInput.setInputFiles(testFile);
    await page.locator('.convert-button').click();
    await expect(page.locator('.result-section')).toBeVisible({ timeout: 30000 });
    
    await expect(page.locator('svg')).toBeVisible();
  });
});
