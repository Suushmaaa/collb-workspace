import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorsController } from './collaborators.controller';
import { Collaborator } from './entities/collaborator.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { UsersModule } from '../users/entities/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, Workspace]),
    UsersModule,
  ],
  controllers: [CollaboratorsController],
  providers: [CollaboratorsService],
  exports: [CollaboratorsService],
})
export class CollaboratorsModule {}