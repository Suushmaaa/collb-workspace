import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    // Verify project ownership
    const project = await this.projectRepository.findOne({
      where: { id: createWorkspaceDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('You are not the project owner');
    }

    const workspace = this.workspaceRepository.create(createWorkspaceDto);
    return this.workspaceRepository.save(workspace);
  }

  async findAll(projectId: string, userId: string) {
    // Verify project access
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.workspaceRepository.find({
      where: { projectId },
      relations: ['collaborators', 'collaborators.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['project', 'collaborators', 'collaborators.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.project.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return workspace;
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId: string,
  ) {
    const workspace = await this.findOne(id, userId);
    Object.assign(workspace, updateWorkspaceDto);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string, userId: string) {
    const workspace = await this.findOne(id, userId);
    await this.workspaceRepository.remove(workspace);
    return { message: 'Workspace deleted successfully' };
  }
}