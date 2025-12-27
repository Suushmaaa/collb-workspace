import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job as BullJob } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../entities/job.entity';

@Processor('jobs')
export class JobProcessor {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  @Process('code-execution')
  async handleCodeExecution(job: BullJob) {
    this.logger.log(`Processing job ${job.id}: ${job.data.jobId}`);

    const dbJob = await this.jobRepository.findOne({
      where: { id: job.data.jobId },
    });

    if (!dbJob) {
      throw new Error('Job not found in database');
    }

    // Update job status
    dbJob.status = JobStatus.PROCESSING;
    dbJob.startedAt = new Date();
    dbJob.attempts += 1;
    await this.jobRepository.save(dbJob);

    try {
      // Simulate code execution
      const result = await this.simulateCodeExecution(dbJob.payload);

      // Update job with result
      dbJob.status = JobStatus.COMPLETED;
      dbJob.result = result;
      dbJob.completedAt = new Date();
      await this.jobRepository.save(dbJob);

      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);

      // Check if we should retry
      if (dbJob.attempts < dbJob.maxAttempts) {
        dbJob.status = JobStatus.RETRYING;
        dbJob.error = error.message;
        await this.jobRepository.save(dbJob);
        throw error; // This will trigger Bull's retry mechanism
      } else {
        dbJob.status = JobStatus.FAILED;
        dbJob.error = error.message;
        dbJob.completedAt = new Date();
        await this.jobRepository.save(dbJob);
        throw error;
      }
    }
  }

  @Process('file-processing')
  async handleFileProcessing(job: BullJob) {
    this.logger.log(`Processing file job ${job.id}`);

    const dbJob = await this.jobRepository.findOne({
      where: { id: job.data.jobId },
    });

    if (!dbJob) {
      throw new Error('Job not found in database');
    }

    dbJob.status = JobStatus.PROCESSING;
    dbJob.startedAt = new Date();
    dbJob.attempts += 1;
    await this.jobRepository.save(dbJob);

    try {
      // Simulate file processing
      await this.sleep(2000);

      const result = {
        processed: true,
        fileName: dbJob.payload.fileName,
        size: dbJob.payload.size || 1024,
        timestamp: new Date().toISOString(),
      };

      dbJob.status = JobStatus.COMPLETED;
      dbJob.result = result;
      dbJob.completedAt = new Date();
      await this.jobRepository.save(dbJob);

      return result;
    } catch (error) {
      if (dbJob.attempts < dbJob.maxAttempts) {
        dbJob.status = JobStatus.RETRYING;
        dbJob.error = error.message;
        await this.jobRepository.save(dbJob);
        throw error;
      } else {
        dbJob.status = JobStatus.FAILED;
        dbJob.error = error.message;
        dbJob.completedAt = new Date();
        await this.jobRepository.save(dbJob);
        throw error;
      }
    }
  }

  @OnQueueActive()
  onActive(job: BullJob) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: BullJob, result: any) {
    this.logger.log(`Job ${job.id} completed with result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: BullJob, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }

  private async simulateCodeExecution(payload: any): Promise<any> {
    const { code, language } = payload;

    // Simulate processing time
    await this.sleep(3000);

    // Simulate random failures for testing retry logic
    if (Math.random() < 0.2) {
      throw new Error('Simulated execution error');
    }

    // Mock execution result
    return {
      success: true,
      output: `Executed ${language} code successfully`,
      code: code.substring(0, 100), // Truncate for response
      executionTime: Math.floor(Math.random() * 1000) + 500,
      timestamp: new Date().toISOString(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}