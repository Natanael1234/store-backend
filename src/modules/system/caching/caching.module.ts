import { CacheModule, Module } from '@nestjs/common';
import { CachingConfig } from './configs/caching.config';
import { CachingService } from './services/caching.service';

const redisStore = require('cache-manager-redis-store');

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      // TODO: https://github.com/dabroek/node-cache-manager-redis-store/issues/53#issuecomment-1372944703
      store: redisStore.redisStore,
      url: `redis://${CachingConfig.REDIS_HOST}:${CachingConfig.REDIS_PORT}`,
    }),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
