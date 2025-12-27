import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;
  private subscriber: Redis;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeRedis();
  }

  private initializeRedis() {
    const redisConfig = {
      host: this.configService.get('database.redis.host'),
      port: this.configService.get('database.redis.port'),
      password: this.configService.get('database.redis.password'),
      tls: this.configService.get('database.redis.tls'),
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.subscriber.on('message', (channel, message) => {
      const handlers = this.eventHandlers.get(channel) || [];
      const data = JSON.parse(message);
      handlers.forEach((handler) => handler(data));
    });
  }

  onModuleDestroy() {
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }

  async publish(channel: string, data: any) {
    await this.publisher.publish(channel, JSON.stringify(data));
  }

  async subscribe(channel: string, handler: Function) {
    if (!this.subscriber) {
      this.initializeRedis();
    }
    await this.subscriber.subscribe(channel);
    const handlers = this.eventHandlers.get(channel) || [];
    handlers.push(handler);
    this.eventHandlers.set(channel, handlers);
  }

  async unsubscribe(channel: string) {
    await this.subscriber.unsubscribe(channel);
    this.eventHandlers.delete(channel);
  }
}