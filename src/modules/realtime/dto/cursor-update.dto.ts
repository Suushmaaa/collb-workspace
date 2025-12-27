import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CursorUpdateDto {
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNumber()
  line: number;

  @IsNumber()
  column: number;
}