import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobStatus } from './entities/job.entity';

@ApiTags('Jobs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and queue a new job' })
  createJob(@Body() createJobDto: CreateJobDto, @CurrentUser() user: any) {
    return this.jobsService.createJob(createJobDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs for current user' })
  @ApiQuery({ name: 'status', enum: JobStatus, required: false })
  getUserJobs(
    @Query('status') status: JobStatus,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.getUserJobs(user.userId, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job queue statistics' })
  getQueueStats() {
    return this.jobsService.getQueueStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  getJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.getJob(id, user.userId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  retryJob(@Param('id') id: string, @CurrentUser() user: any) {
    return this.jobsService.retryJob(id, user.userId);
  }
}