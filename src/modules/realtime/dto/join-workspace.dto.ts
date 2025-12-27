import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class JoinWorkspaceDto {
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  userName: string;
}