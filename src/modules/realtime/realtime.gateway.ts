import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { FileChangeDto } from './dto/file-change.dto';
import { CursorUpdateDto } from './dto/cursor-update.dto';
import { RedisPubSubService } from './redis-pubsub.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RealtimeGateway');
  private activeUsers: Map<string, Set<string>> = new Map(); // workspaceId -> Set of socketIds

  constructor(private redisPubSub: RedisPubSubService) {}

  async afterInit() {
    this.logger.log('WebSocket Gateway initialized');

    // Subscribe to Redis channels for broadcasting
    await this.redisPubSub.subscribe('workspace:*', (data) => {
      this.handleRedisMessage(data);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from all workspaces
    this.activeUsers.forEach((users, workspaceId) => {
      if (users.has(client.id)) {
        users.delete(client.id);
        this.broadcastToWorkspace(workspaceId, 'user:left', {
          socketId: client.id,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join:workspace')
  async handleJoinWorkspace(
    @MessageBody() data: JoinWorkspaceDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { workspaceId, userName } = data;

    // Join socket room
    client.join(`workspace:${workspaceId}`);

    // Track active user
    if (!this.activeUsers.has(workspaceId)) {
      this.activeUsers.set(workspaceId, new Set());
    }
    this.activeUsers.get(workspaceId)!.add(client.id);

    // Store user info in socket
    client.data.userName = userName;
    client.data.workspaceId = workspaceId;

    // Broadcast join event
    const joinEvent = {
      socketId: client.id,
      userName,
      workspaceId,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToWorkspace(workspaceId, 'user:joined', joinEvent);

    // Publish to Redis for other servers
    await this.redisPubSub.publish(`workspace:${workspaceId}`, {
      event: 'user:joined',
      data: joinEvent,
    });

    this.logger.log(`User ${userName} joined workspace ${workspaceId}`);

    return {
      success: true,
      message: 'Joined workspace successfully',
      activeUsers: this.activeUsers.get(workspaceId)?.size || 0,
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave:workspace')
  async handleLeaveWorkspace(
    @MessageBody() data: { workspaceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { workspaceId } = data;

    // Leave socket room
    client.leave(`workspace:${workspaceId}`);

    // Remove from active users
    if (this.activeUsers.has(workspaceId)) {
      this.activeUsers.get(workspaceId)!.delete(client.id);
    }

    // Broadcast leave event
    const leaveEvent = {
      socketId: client.id,
      userName: client.data.userName,
      workspaceId,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToWorkspace(workspaceId, 'user:left', leaveEvent);

    // Publish to Redis
    await this.redisPubSub.publish(`workspace:${workspaceId}`, {
      event: 'user:left',
      data: leaveEvent,
    });

    this.logger.log(
      `User ${client.data.userName} left workspace ${workspaceId}`,
    );

    return { success: true, message: 'Left workspace successfully' };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('file:change')
  async handleFileChange(
    @MessageBody() data: FileChangeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { workspaceId, fileName, changeType, content } = data;

    const fileChangeEvent = {
      socketId: client.id,
      userName: client.data.userName,
      workspaceId,
      fileName,
      changeType,
      content: content || null,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all except sender
    this.server
      .to(`workspace:${workspaceId}`)
      .except(client.id)
      .emit('file:changed', fileChangeEvent);

    // Publish to Redis
    await this.redisPubSub.publish(`workspace:${workspaceId}`, {
      event: 'file:changed',
      data: fileChangeEvent,
    });

    this.logger.log(
      `File ${fileName} ${changeType} in workspace ${workspaceId}`,
    );

    return { success: true, message: 'File change broadcasted' };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('cursor:update')
  async handleCursorUpdate(
    @MessageBody() data: CursorUpdateDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { workspaceId, fileName, line, column } = data;

    const cursorEvent = {
      socketId: client.id,
      userName: client.data.userName,
      workspaceId,
      fileName,
      position: { line, column },
      timestamp: new Date().toISOString(),
    };

    // Broadcast to all except sender
    this.server
      .to(`workspace:${workspaceId}`)
      .except(client.id)
      .emit('cursor:updated', cursorEvent);

    return { success: true };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  private broadcastToWorkspace(
    workspaceId: string,
    event: string,
    data: any,
  ) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  private handleRedisMessage(message: any) {
    const { event, data } = message;
    if (data.workspaceId) {
      this.broadcastToWorkspace(data.workspaceId, event, data);
    }
  }
}