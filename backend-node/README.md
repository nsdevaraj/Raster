# Backend Image Upload Service

Express-based backend service for image upload, storage, and management with support for PNG, JPG, BMP, and TIFF formats.

## Features

- **File Upload**: Support for single and batch uploads via Multer
- **Format Validation**: Validates PNG, JPG, BMP, and TIFF formats
- **UUID-based Storage**: Secure file naming with UUID identifiers
- **Metadata Extraction**: Automatically extracts dimensions, format, and file size
- **Preview Generation**: Creates optimized preview images using Sharp
- **Persistent Storage**: Metadata stored in lightweight lowdb JSON database
- **RESTful API**: Full CRUD operations for image management
- **File Streaming**: Efficient asset streaming for original and preview images

## Tech Stack

- **Express.js**: Web framework
- **Multer**: File upload middleware
- **Sharp**: Image processing and metadata extraction
- **lowdb**: Lightweight JSON database
- **UUID**: Unique identifier generation
- **Jest & Supertest**: Testing framework

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configuration options:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production/test)
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 25MB)
- `UPLOAD_DIR`: Base directory for uploads (default: ./storage)
- `DB_PATH`: Path to metadata database (default: ./data/db.json)
- `MAX_UPLOAD_COUNT`: Maximum files per upload (default: 10)
- `PREVIEW_WIDTH`: Preview image width in pixels (default: 480)

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### Upload Images

**POST** `/api/images/upload`

Upload one or multiple images (batch upload).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `files` (single or multiple files)
- Supported formats: PNG, JPG, BMP, TIFF
- Max files per upload: 10 (configurable)
- Max file size: 25MB (configurable)

**Response:**
```json
{
  "message": "Files processed",
  "uploaded": 2,
  "failed": 0,
  "results": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "originalFilename": "example.png",
      "metadata": {
        "width": 1920,
        "height": 1080,
        "format": "png",
        "fileSize": 524288,
        "channels": 4,
        "depth": "uchar",
        "hasAlpha": true
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### List Images

**GET** `/api/images`

Retrieve a list of all uploaded images (sorted by newest first).

**Response:**
```json
{
  "images": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "originalFilename": "example.png",
      "storedFilename": "f47ac10b-58cc-4372-a567-0e02b2c3d479_original.png",
      "previewFilename": "f47ac10b-58cc-4372-a567-0e02b2c3d479_preview.jpg",
      "originalPath": "tmp/...",
      "previewPath": "processed/...",
      "mimeType": "image/png",
      "previewMimeType": "image/jpeg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "metadata": { ... }
    }
  ]
}
```

### Get Image Metadata

**GET** `/api/images/:id`

Retrieve detailed metadata for a specific image.

**Response:**
```json
{
  "image": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "originalFilename": "example.png",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "png",
      "space": "srgb",
      "channels": 4,
      "depth": "uchar",
      "density": 72,
      "hasAlpha": true,
      "fileSize": 524288
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Stream Original Image

**GET** `/api/images/:id/original`

Stream the original uploaded image file.

**Response:**
- Content-Type: `image/png|jpeg|bmp|tiff`
- Content-Disposition: `inline; filename="..."`
- Binary image data

### Stream Preview Image

**GET** `/api/images/:id/preview`

Stream the optimized preview image (JPEG format, max width 480px).

**Response:**
- Content-Type: `image/jpeg`
- Content-Disposition: `inline; filename="..."`
- Binary image data

### Delete Image

**DELETE** `/api/images/:id`

Delete an image and its associated files.

**Response:**
```json
{
  "message": "Image deleted successfully",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

### Health Check

**GET** `/health`

Check service health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Directory Structure

```
backend-node/
├── src/
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic services
│   ├── middleware/    # Express middleware
│   ├── utils/         # Utility functions
│   ├── config.js      # Configuration management
│   ├── app.js         # Express app setup
│   └── server.js      # Server entry point
├── tests/             # Test suites
│   ├── upload.test.js        # Upload endpoint tests
│   ├── metadata.test.js      # Metadata endpoint tests
│   ├── assetStream.test.js   # Streaming endpoint tests
│   ├── testUtils.js          # Test utilities
│   └── setup.js              # Test setup
├── storage/
│   ├── tmp/           # Temporary uploads (originals)
│   └── processed/     # Processed preview images
├── data/
│   └── db.json        # Metadata database
├── package.json
└── README.md
```

## Storage Organization

- **tmp/**: Original uploaded files with UUID-based naming
- **processed/**: Generated preview images (480px width, JPEG format)
- **data/db.json**: Metadata database containing image records

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created (upload success)
- `400`: Bad request (invalid format, too many files)
- `404`: Not found (image doesn't exist)
- `413`: Payload too large (file size exceeds limit)
- `500`: Internal server error

## Testing

The test suite includes:

- ✅ Single and batch upload
- ✅ File format validation (PNG, JPG, BMP, TIFF)
- ✅ Invalid format rejection
- ✅ File size limit enforcement
- ✅ Upload count limit enforcement
- ✅ Metadata extraction and retrieval
- ✅ Image listing and sorting
- ✅ Original and preview asset streaming
- ✅ Image deletion

Run tests:
```bash
npm test
```

## Integration

This service can be integrated with the existing FastAPI backend or run standalone. It exposes a RESTful API on a separate port (default: 3001) from the main backend.

## License

MIT
