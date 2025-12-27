import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

// Config imports
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/entities/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, jwtConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.postgres.host'),
        port: configService.get('database.postgres.port'),
        username: configService.get('database.postgres.username'),
        password: configService.get('database.postgres.password'),
        database: configService.get('database.postgres.database'),
        ssl: configService.get('database.postgres.ssl')
          ? { rejectUnauthorized: false }
          : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('database.redis.host'),
          port: configService.get('database.redis.port'),
          password: configService.get('database.redis.password'),
          tls: configService.get('database.redis.tls'),
        },
      }),
    }),
ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
    ]),

    // Feature Modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    WorkspacesModule,
    CollaboratorsModule,
    RealtimeModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}