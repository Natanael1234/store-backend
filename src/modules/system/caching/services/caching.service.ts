import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CachingService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setValue(key: string, value: string, ttl?: number): Promise<void> {
    return await this.cacheManager.set(key, value, ttl | 0);
  }

  async getValue(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async removeValue(key: string): Promise<void> {
    return await this.cacheManager.del(key);
  }

  async resetCache(): Promise<void> {
    return await this.cacheManager.reset();
  }
}
