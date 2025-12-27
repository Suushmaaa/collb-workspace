import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobProcessor } from './processors/job.processor';
import { Job } from './entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({
      name: 'jobs',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobProcessor],
  exports: [JobsService],
})
export class JobsModule {}