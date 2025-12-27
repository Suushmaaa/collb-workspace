import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Collaborator } from '../../collaborators/entities/collaborator.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.workspaces)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => Collaborator, (collaborator) => collaborator.workspace)
  collaborators: Collaborator[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}