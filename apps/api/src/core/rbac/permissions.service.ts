import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { ALL_PERMISSIONS, SystemRole } from '@travelos/types';
import { PrismaService } from '../database/prisma.service';
import { REDIS_CONNECTION } from '../queue/queue.constants';

const CACHE_TTL_SECONDS = 300;
const WILDCARD = ALL_PERMISSIONS;

/** Roles that implicitly grant every permission. */
const SUPERUSER_ROLES = new Set<string>([SystemRole.SuperAdmin, SystemRole.Admin]);

export type EffectivePermissions = Set<string> | typeof WILDCARD;

/**
 * Resolves a user's effective permissions (union of all their roles' grants),
 * cached in Redis. Super Admin / Admin resolve to the `*` wildcard.
 */
@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
  ) {}

  private cacheKey(userId: string): string {
    return `perms:${userId}`;
  }

  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const cached = await this.redis.get(this.cacheKey(userId));
    if (cached) {
      return cached === WILDCARD ? WILDCARD : new Set(JSON.parse(cached) as string[]);
    }

    const userRoles = await this.prisma.unscoped.userRole.findMany({
      where: { userId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });

    let result: EffectivePermissions;
    if (userRoles.some((ur) => SUPERUSER_ROLES.has(ur.role.key))) {
      result = WILDCARD;
    } else {
      const keys = new Set<string>();
      for (const ur of userRoles) {
        for (const rp of ur.role.rolePermissions) keys.add(rp.permission.key);
      }
      result = keys;
    }

    await this.redis.set(
      this.cacheKey(userId),
      result === WILDCARD ? WILDCARD : JSON.stringify([...result]),
      'EX',
      CACHE_TTL_SECONDS,
    );
    return result;
  }

  /** Invalidate after role/permission changes. */
  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.cacheKey(userId));
  }

  static has(perms: EffectivePermissions, required: string): boolean {
    if (perms === WILDCARD) return true;
    if (perms.has(required)) return true;
    // `read` satisfies a `read_own` requirement (broader implies narrower).
    if (required.endsWith('.read_own')) {
      return perms.has(required.replace('.read_own', '.read'));
    }
    return false;
  }
}
