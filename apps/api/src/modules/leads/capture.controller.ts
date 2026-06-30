import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { LeadsService } from './leads.service';
import { CaptureLeadDto } from './dto/capture.dto';

/**
 * Public, unauthenticated lead capture from websites / landing pages / form
 * integrations. The tenant is resolved from the source; a per-source secret
 * gates the endpoint.
 */
@ApiTags('Lead Capture')
@Controller('capture')
export class CaptureController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly leads: LeadsService,
  ) {}

  @Public()
  @Post(':sourceId')
  async capture(
    @Param('sourceId') sourceId: string,
    // Tolerant pipe: external providers send many extra fields — strip them
    // (whitelist) instead of rejecting (the global pipe forbids non-whitelisted).
    @Body(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
    body: CaptureLeadDto,
    @Headers('x-capture-secret') headerSecret?: string,
  ) {
    const source = await this.prisma.unscoped.leadSource.findUnique({ where: { id: sourceId } });
    if (!source || !source.isActive) {
      throw new UnauthorizedException({ code: 'SOURCE_INVALID', error: 'Unknown or inactive source' });
    }
    if (source.secret && source.secret !== (headerSecret ?? body.secret)) {
      throw new UnauthorizedException({ code: 'SOURCE_SECRET', error: 'Invalid capture secret' });
    }

    const name = body.name?.trim() || body.email || body.phone;
    if (!name) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', error: 'name, email or phone is required' });
    }

    // Resolve tenant context for the RLS-scoped write.
    this.ctx.patch({ tenantId: source.tenantId });

    return this.leads.create(
      {
        name,
        email: body.email,
        phone: body.phone,
        destination: body.destination,
        travelDate: body.travelDate,
        adults: body.adults,
        children: body.children,
        budgetAmount: body.budgetAmount,
        specialRequests: body.message,
        sourceLabel: source.name,
        metadata: body.metadata ?? {},
      },
      { sourceId: source.id },
    );
  }
}
