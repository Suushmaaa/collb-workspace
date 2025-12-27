import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CollaboratorsService } from './collaborators.service';
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { UpdateCollaboratorRoleDto } from './dto/update-collaborator-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Collaborators')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post('invite')
  @ApiOperation({ summary: 'Invite a user to workspace as collaborator' })
  inviteCollaborator(
    @Body() inviteDto: InviteCollaboratorDto,
    @CurrentUser() user: any,
  ) {
    return this.collaboratorsService.inviteCollaborator(inviteDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collaborators for a workspace' })
  @ApiQuery({ name: 'workspaceId', required: true })
  getWorkspaceCollaborators(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.collaboratorsService.getWorkspaceCollaborators(
      workspaceId,
      user.userId,
    );
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update collaborator role' })
  updateCollaboratorRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateCollaboratorRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.collaboratorsService.updateCollaboratorRole(
      id,
      updateRoleDto,
      user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove collaborator from workspace' })
  removeCollaborator(@Param('id') id: string, @CurrentUser() user: any) {
    return this.collaboratorsService.removeCollaborator(id, user.userId);
  }
}