import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import { ItineraryBuilderProvider } from '../../integrations/itinerary/itinerary.provider';
import type { ImportItineraryDto } from './dto/itinerary.dto';

@Injectable()
export class ItineraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
    private readonly provider: ItineraryBuilderProvider,
  ) {}

  async import(dto: ImportItineraryDto) {
    const tenantId = this.ctx.tenantId!;
    const fetched = await this.provider.fetch(dto.externalId);

    const itinerary = await this.prisma.db.itinerary.create({
      data: {
        tenantId,
        leadId: dto.leadId,
        externalId: dto.externalId,
        title: fetched.title,
        destination: fetched.destination,
        durationDays: fetched.durationDays,
        source: 'imported',
        versions: {
          create: {
            tenantId,
            versionNo: 1,
            payload: fetched.payload as Prisma.InputJsonValue,
            externalVersionRef: fetched.externalVersionRef,
          },
        },
      },
      include: { versions: true },
    });

    await this.prisma.db.itinerary.update({
      where: { id: itinerary.id },
      data: { currentVersionId: itinerary.versions[0].id },
    });
    await this.audit.record({ action: 'created', resourceType: 'itinerary', resourceId: itinerary.id });
    return itinerary;
  }

  async get(id: string) {
    const itinerary = await this.prisma.db.itinerary.findFirst({
      where: { id },
      include: { versions: { orderBy: { versionNo: 'asc' } } },
    });
    if (!itinerary) throw new NotFoundException({ code: 'NOT_FOUND', error: 'Itinerary not found' });
    return itinerary;
  }

  listVersions(id: string) {
    return this.prisma.db.itineraryVersion.findMany({
      where: { itineraryId: id },
      orderBy: { versionNo: 'desc' },
    });
  }

  /** Pull the latest from the builder as a new version. */
  async sync(id: string) {
    const itinerary = await this.get(id);
    if (!itinerary.externalId) {
      return itinerary;
    }
    const fetched = await this.provider.fetch(itinerary.externalId);
    const versionNo = (itinerary.versions.at(-1)?.versionNo ?? 0) + 1;

    const version = await this.prisma.db.itineraryVersion.create({
      data: {
        tenantId: itinerary.tenantId,
        itineraryId: id,
        versionNo,
        payload: fetched.payload as Prisma.InputJsonValue,
        externalVersionRef: fetched.externalVersionRef,
      },
    });
    await this.prisma.db.itinerary.update({
      where: { id },
      data: {
        currentVersionId: version.id,
        title: fetched.title,
        destination: fetched.destination,
        durationDays: fetched.durationDays,
      },
    });
    await this.audit.record({ action: 'updated', resourceType: 'itinerary', resourceId: id });
    return version;
  }
}
