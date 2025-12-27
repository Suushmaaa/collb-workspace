import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  postgres: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  },
}));