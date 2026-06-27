import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CONNECTION } from '../queue/queue.constants';
import { buildReferenceCode } from './lead.util';

/**
 * Generates monotonic, human-friendly reference codes per tenant per year
 * (e.g. LD-2026-000123) using a Redis counter seeded from a provided base.
 */
@Injectable()
export class ReferenceCodeService {
  constructor(@Inject(REDIS_CONNECTION) private readonly redis: Redis) {}

  async next(prefix: string, tenantId: string, year: number, seedBase: () => Promise<number>): Promise<string> {
    const key = `seq:${prefix}:${tenantId}:${year}`;
    const value = await this.redis.incr(key);
    if (value === 1) {
      // First use this period — seed from existing rows to avoid collisions.
      const base = await seedBase();
      if (base > 0) {
        const seeded = await this.redis.incrby(key, base);
        return buildReferenceCode(prefix, year, seeded);
      }
    }
    return buildReferenceCode(prefix, year, value);
  }
}
