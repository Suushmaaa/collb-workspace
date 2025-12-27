import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Job, JobStatus, JobType } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectQueue('jobs')
    private jobQueue: Queue,
  ) {}

  async createJob(createJobDto: CreateJobDto, userId: string) {
    // Create job in database
    const job = this.jobRepository.create({
      ...createJobDto,
      userId,
      status: JobStatus.PENDING,
    });

    await this.jobRepository.save(job);

    // Add job to queue based on type
    const queueName = this.getQueueNameForJobType(createJobDto.type);
    
    await this.jobQueue.add(
      queueName,
      { jobId: job.id },
      {
        attempts: job.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2 seconds initial delay
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    return {
      message: 'Job created and queued successfully',
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
      },
    };
  }

  async getJob(id: string, userId: string) {
    const job = await this.jobRepository.findOne({
      where: { id, userId },
      relations: ['user', 'workspace'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getUserJobs(userId: string, status?: JobStatus) {
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }

    return this.jobRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 jobs
    });
  }

  async getWorkspaceJobs(workspaceId: string, userId: string) {
    // TODO: Add authorization check for workspace access
    return this.jobRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async retryJob(id: string, userId: string) {
    const job = await this.getJob(id, userId);

    if (job.status !== JobStatus.FAILED) {
      throw new Error('Only failed jobs can be retried');
    }

    // Reset job
    job.status = JobStatus.PENDING;
    job.attempts = 0;
    job.error = null;
    job.startedAt = null;
    job.completedAt = null;
    await this.jobRepository.save(job);

    // Re-add to queue
    const queueName = this.getQueueNameForJobType(job.type);
    await this.jobQueue.add(
      queueName,
      { jobId: job.id },
      {
        attempts: job.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return {
      message: 'Job requeued successfully',
      job: {
        id: job.id,
        status: job.status,
      },
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobQueue.getWaitingCount(),
      this.jobQueue.getActiveCount(),
      this.jobQueue.getCompletedCount(),
      this.jobQueue.getFailedCount(),
      this.jobQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  private getQueueNameForJobType(type: JobType): string {
    switch (type) {
      case JobType.CODE_EXECUTION:
        return 'code-execution';
      case JobType.FILE_PROCESSING:
        return 'file-processing';
      case JobType.DATA_EXPORT:
        return 'data-export';
      default:
        return 'code-execution';
    }
  }
}