import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Development Environment' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Main development workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
}