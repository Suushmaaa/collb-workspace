import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateCollaboratorRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.VIEWER })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}