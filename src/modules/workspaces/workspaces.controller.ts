import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.create(createWorkspaceDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for a project' })
  @ApiQuery({ name: 'projectId', required: true })
  findAll(@Query('projectId') projectId: string, @CurrentUser() user: any) {
    return this.workspacesService.findAll(projectId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspacesService.update(id, updateWorkspaceDto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workspace' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workspacesService.remove(id, user.userId);
  }
}