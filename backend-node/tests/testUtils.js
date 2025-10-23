const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const bmp = require('bmp-js');

async function createTestImage(width, height, format = 'png') {
  const sharpInstance = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  });

  if (format === 'bmp') {
    const pngBuffer = await sharpInstance.png().toBuffer();
    const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
    const bmpData = {
      width: info.width,
      height: info.height,
      data: Buffer.from(data)
    };
    
    const rawBmpData = bmp.encode(bmpData);
    return rawBmpData.data;
  }

  const buffer = await sharpInstance.toFormat(format).toBuffer();
  return buffer;
}

async function createTestImageFile(filepath, width = 100, height = 100, format = 'png') {
  const buffer = await createTestImage(width, height, format);
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

async function createInvalidImageFile(filepath) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, 'This is not a valid image file');
  return filepath;
}

module.exports = {
  createTestImage,
  createTestImageFile,
  createInvalidImageFile
};
