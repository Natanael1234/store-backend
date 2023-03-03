import { CachingService } from './services/caching.service';
import { Module, CacheModule, CacheStore } from '@nestjs/common';
const redisStore = require('cache-manager-redis-store');
console.log('redisStore', redisStore);

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      // TODO: https://github.com/dabroek/node-cache-manager-redis-store/issues/53#issuecomment-1372944703
      store: redisStore.redisStore,
      // store: redisStore as unknown as CacheStore,
      // host: process.env.REDIS_HOST,
      // port: process.env.REDIS_PORT,
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    }),

    // CacheModule.register(),
  ],
  providers: [CachingService],
  exports: [CachingService],
})
export class CachingModule {}
