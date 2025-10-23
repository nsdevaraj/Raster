const express = require('express');
const cors = require('cors');
const imageRoutes = require('./routes/images');
const errorHandler = require('./middleware/errorHandler');
const metadataService = require('./services/metadataService');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/images', imageRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

async function initializeApp() {
  await metadataService.initialize();
}

initializeApp().catch(err => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});

module.exports = app;
