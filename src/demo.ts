import config from './config';
import logger from './config/logger';
import { createDemoApp } from './app';

async function startServer() {
  const app = await createDemoApp();

  app.listen(config.app.port, () => {
    logger.info(` Server ready at http://localhost:${config.app.port}/graphql`);
    logger.info(`Health check at http://localhost:${config.app.port}/health`);
    logger.info(`Environment: ${config.app.env}`);
    logger.info(`Apollo Explorer: http://localhost:${config.app.port}/graphql`);
    logger.info(`Open the URL above in your browser to test with Apollo Explorer!`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down');
    process.exit(0);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
