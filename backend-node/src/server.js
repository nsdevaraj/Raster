const http = require('http');
const app = require('./app');
const config = require('./config');
const { ensureWorkspace } = require('./services/imageService');

async function start() {
  await ensureWorkspace();

  const server = http.createServer(app);
  server.listen(config.port, () => {
    console.log(`Image upload service listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
