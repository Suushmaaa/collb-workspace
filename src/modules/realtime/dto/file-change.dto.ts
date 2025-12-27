import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';

export enum FileChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export class FileChangeDto {
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsEnum(FileChangeType)
  @IsNotEmpty()
  changeType: FileChangeType;

  @IsString()
  content?: string;
}