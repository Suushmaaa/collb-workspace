import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.user = payload;
      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: any): string | null {
    const authHeader = client.handshake?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check query params for token
    const token = client.handshake?.query?.token;
    return token || null;
  }
}