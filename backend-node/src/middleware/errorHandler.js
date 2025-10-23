function errorHandler(err, req, res, next) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File size exceeds limit' });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded' });
    }

    if (err.message && err.message.includes('Invalid file type')) {
      return res.status(400).json({ message: err.message });
    }

    if (err.name === 'NotFoundError') {
      return res.status(404).json({ message: err.message });
    }

    return res.status(500).json({ message: err.message || 'Internal server error' });
  }

  return next();
}

module.exports = errorHandler;
