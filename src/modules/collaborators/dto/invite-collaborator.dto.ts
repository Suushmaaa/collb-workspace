import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class InviteCollaboratorDto {
  @ApiProperty({ example: 'uuid-of-workspace' })
  @IsUUID()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({ example: 'collaborator@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.COLLABORATOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}