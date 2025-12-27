import { ApiProperty } from '@nestjs/swagger';
import { JobStatus, JobType } from '../entities/job.entity';

export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: JobType })
  type: JobType;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiProperty()
  payload: any;

  @ApiProperty({ required: false })
  result?: any;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty()
  attempts: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;
}