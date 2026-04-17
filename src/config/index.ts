import { config as envConfig } from './env';

// Validate environment variables early (fail-fast on startup)
const env = envConfig;

interface Config {
  app: {
    name: string;
    env: string;
    port: number;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  app: {
    name: env.APP_NAME,
    env: env.NODE_ENV,
    port: env.PORT,
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
};

export default config;
