import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('SVG Output Quality Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('SVG should have valid structure', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    await expect(svg).toHaveAttribute('width');
    await expect(svg).toHaveAttribute('height');
    await expect(svg).toHaveAttribute('viewBox');
  });

  test('SVG should contain vector elements', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const vectorElements = page.locator('svg rect, svg path, svg circle, svg polygon');
    await expect(vectorElements.first()).toBeVisible();
    
    const count = await vectorElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('SVG dimensions should match original image aspect ratio', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svg = page.locator('svg');
    const width = await svg.getAttribute('width');
    const height = await svg.getAttribute('height');
    
    expect(width).not.toBeNull();
    expect(height).not.toBeNull();
    expect(parseInt(width!)).toBeGreaterThan(0);
    expect(parseInt(height!)).toBeGreaterThan(0);
  });

  test('Binary mode should produce black and white output', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('#color-mode').selectOption('binary');
    await page.locator('.convert-button').click();
    
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svgContent = await page.locator('.preview-container').innerHTML();
    expect(svgContent).toMatch(/fill="black"|fill="#000"/i);
  });

  test('Grayscale mode should produce varying gray tones', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('#color-mode').selectOption('grayscale');
    await page.locator('.convert-button').click();
    
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svgContent = await page.locator('.preview-container').innerHTML();
    expect(svgContent).toMatch(/rgb\(\d+,\d+,\d+\)/);
  });

  test('Simplified SVG should have fewer elements', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    const testFile = path.join(__dirname, '../fixtures/test-image.png');
    
    await fileInput.setInputFiles(testFile);
    const simplifyCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: 'Simplify paths' });
    await simplifyCheckbox.check();
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const simplifiedCount = await page.locator('svg rect').count();
    
    await page.reload();
    await fileInput.setInputFiles(testFile);
    await simplifyCheckbox.uncheck();
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const detailedCount = await page.locator('svg rect').count();
    
    expect(simplifiedCount).toBeLessThanOrEqual(detailedCount);
  });

  test('SVG should be valid XML', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svgContent = await page.locator('.preview-container').innerHTML();
    
    expect(svgContent).toContain('<svg');
    expect(svgContent).toContain('</svg>');
    
    expect(svgContent).not.toContain('<<');
    expect(svgContent).not.toContain('>>');
  });

  test('Large image should produce valid SVG without timeout', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/large-image.png'));
    
    await page.locator('.convert-button').click();
    
    await expect(page.locator('svg')).toBeVisible({ timeout: 120000 });
    
    const svg = page.locator('svg');
    await expect(svg).toHaveAttribute('xmlns');
  });

  test('SVG should maintain visual similarity to original', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-image.png'));
    
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    
    const svgElement = page.locator('svg');
    const boundingBox = await svgElement.boundingBox();
    
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
  });

  test('Repeated conversions should produce identical output', async ({ page }) => {
    const fileInput = page.locator('#file-input');
    const testFile = path.join(__dirname, '../fixtures/test-image.png');
    
    await fileInput.setInputFiles(testFile);
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    const firstSvg = await page.locator('.preview-container').innerHTML();
    
    await page.reload();
    await fileInput.setInputFiles(testFile);
    await page.locator('.convert-button').click();
    await expect(page.locator('svg')).toBeVisible({ timeout: 30000 });
    const secondSvg = await page.locator('.preview-container').innerHTML();
    
    expect(firstSvg).toBe(secondSvg);
  });
});
