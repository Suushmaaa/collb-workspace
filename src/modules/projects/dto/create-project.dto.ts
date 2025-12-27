import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Awesome Project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A collaborative coding project', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}