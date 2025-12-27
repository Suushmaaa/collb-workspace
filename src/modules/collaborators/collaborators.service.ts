import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './entities/collaborator.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { UsersService } from '../users/entities/users.service';
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { UpdateCollaboratorRoleDto } from './dto/update-collaborator-role.dto';

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectRepository(Collaborator)
    private collaboratorRepository: Repository<Collaborator>,
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
    private usersService: UsersService,
  ) {}

  async inviteCollaborator(
    inviteDto: InviteCollaboratorDto,
    ownerId: string,
  ) {
    // Verify workspace exists and user is owner
    const workspace = await this.workspaceRepository.findOne({
      where: { id: inviteDto.workspaceId },
      relations: ['project'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.project.ownerId !== ownerId) {
      throw new ForbiddenException('Only project owner can invite collaborators');
    }

    // Find user by email
    const user = await this.usersService.findByEmail(inviteDto.email);

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if already a collaborator
    const existingCollaborator = await this.collaboratorRepository.findOne({
      where: {
        workspaceId: inviteDto.workspaceId,
        userId: user.id,
      },
    });

    if (existingCollaborator) {
      throw new ConflictException('User is already a collaborator');
    }

    // Create collaborator
    const collaborator = this.collaboratorRepository.create({
      workspaceId: inviteDto.workspaceId,
      userId: user.id,
      role: inviteDto.role,
    });

    await this.collaboratorRepository.save(collaborator);

    return {
      message: 'Collaborator invited successfully',
      collaborator: {
        id: collaborator.id,
        email: user.email,
        name: user.name,
        role: collaborator.role,
      },
    };
  }

  async getWorkspaceCollaborators(workspaceId: string, userId: string) {
    // Verify workspace access
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['project'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.project.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const collaborators = await this.collaboratorRepository.find({
      where: { workspaceId },
      relations: ['user'],
    });

    return collaborators.map((collab) => ({
      id: collab.id,
      userId: collab.user.id,
      email: collab.user.email,
      name: collab.user.name,
      role: collab.role,
      createdAt: collab.createdAt,
    }));
  }

  async updateCollaboratorRole(
    collaboratorId: string,
    updateRoleDto: UpdateCollaboratorRoleDto,
    userId: string,
  ) {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: collaboratorId },
      relations: ['workspace', 'workspace.project', 'user'],
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (collaborator.workspace.project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can update roles');
    }

    collaborator.role = updateRoleDto.role;
    await this.collaboratorRepository.save(collaborator);

    return {
      message: 'Collaborator role updated successfully',
      collaborator: {
        id: collaborator.id,
        email: collaborator.user.email,
        name: collaborator.user.name,
        role: collaborator.role,
      },
    };
  }

  async removeCollaborator(collaboratorId: string, userId: string) {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: collaboratorId },
      relations: ['workspace', 'workspace.project', 'user'],
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator not found');
    }

    if (collaborator.workspace.project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can remove collaborators');
    }

    await this.collaboratorRepository.remove(collaborator);

    return {
      message: 'Collaborator removed successfully',
    };
  }
}