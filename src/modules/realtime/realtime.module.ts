import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RedisPubSubService } from './redis-pubsub.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RealtimeModule {}