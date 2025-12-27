import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';
import { JobType } from '../entities/job.entity';

export class CreateJobDto {
  @ApiProperty({ enum: JobType, example: JobType.CODE_EXECUTION })
  @IsEnum(JobType)
  @IsNotEmpty()
  type: JobType;

  @ApiProperty({
    example: {
      code: 'console.log("Hello World");',
      language: 'javascript',
    },
  })
  @IsObject()
  @IsNotEmpty()
  payload: any;

  @ApiProperty({ example: 'uuid-of-workspace', required: false })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;
}