import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  appName: process.env.APP_NAME || 'Collab Workspace API',
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
}));
