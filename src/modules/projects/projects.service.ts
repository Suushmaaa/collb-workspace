import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    const project = this.projectRepository.create({
      ...createProjectDto,
      ownerId: userId,
    });

    return this.projectRepository.save(project);
  }

  async findAll(userId: string) {
    return this.projectRepository.find({
      where: { ownerId: userId },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'workspaces'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ) {
    const project = await this.findOne(id, userId);

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string, userId: string) {
    const project = await this.findOne(id, userId);
    await this.projectRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }
}