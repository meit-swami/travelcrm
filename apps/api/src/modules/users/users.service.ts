import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { PermissionsService } from '../../core/rbac';
import type { CreateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContext,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
  ) {}

  /** List users for the active tenant (RLS-scoped via the tenant client). */
  list() {
    return this.prisma.db.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto) {
    const tenantId = this.tenantContext.tenantId!;
    const existing = await this.prisma.db.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({ code: 'CONFLICT', error: 'Email already in use' });
    }

    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;
    const user = await this.prisma.db.user.create({
      data: {
        tenantId,
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        status: dto.password ? 'active' : 'invited',
      },
      select: { id: true, email: true, fullName: true, status: true },
    });

    if (dto.roleIds?.length) {
      await this.prisma.db.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ tenantId, userId: user.id, roleId })),
        skipDuplicates: true,
      });
      await this.permissions.invalidate(user.id);
    }

    await this.audit.record({ action: 'created', resourceType: 'user', resourceId: user.id, after: user });
    return user;
  }
}
