import { Injectable } from '@nestjs/common';
import type { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { TenantContext } from '../../core/tenancy/tenant-context';
import { AuditService } from '../../core/audit';
import type {
  CreateHotelBookingDto,
  CreateTransportBookingDto,
  CreateVendorDto,
  CreateVendorRateDto,
  UpdateBookingStatusDto,
  VendorCommunicationDto,
} from './dto/vendors.dto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
    private readonly audit: AuditService,
  ) {}

  listVendors(type?: string) {
    return this.prisma.db.vendor.findMany({
      where: type ? { type: type as $Enums.VendorType } : {},
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async createVendor(dto: CreateVendorDto) {
    const vendor = await this.prisma.db.vendor.create({
      data: {
        tenantId: this.ctx.tenantId!,
        type: dto.type as $Enums.VendorType,
        name: dto.name,
        destination: dto.destination,
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
    await this.audit.record({ action: 'created', resourceType: 'vendor', resourceId: vendor.id });
    return vendor;
  }

  getVendor(id: string) {
    return this.prisma.db.vendor.findFirst({
      where: { id },
      include: { rates: true, communications: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
  }

  listRates(vendorId: string) {
    return this.prisma.db.vendorRate.findMany({ where: { vendorId } });
  }

  addRate(vendorId: string, dto: CreateVendorRateDto) {
    return this.prisma.db.vendorRate.create({
      data: {
        tenantId: this.ctx.tenantId!,
        vendorId,
        label: dto.label,
        category: dto.category,
        contractRate: dto.contractRate,
        negotiatedRate: dto.negotiatedRate,
        currency: dto.currency ?? 'INR',
        season: dto.season,
      },
    });
  }

  addCommunication(vendorId: string, dto: VendorCommunicationDto) {
    return this.prisma.db.vendorCommunication.create({
      data: {
        tenantId: this.ctx.tenantId!,
        vendorId,
        bookingId: dto.bookingId,
        channel: dto.channel,
        direction: dto.direction,
        subject: dto.subject,
        body: dto.body,
        createdBy: this.ctx.userId,
      },
    });
  }

  // ─────────────────────────── Hotel procurement ───────────────────────────

  listHotelBookings(bookingId: string) {
    return this.prisma.db.hotelBooking.findMany({ where: { bookingId } });
  }

  createHotelBooking(bookingId: string, dto: CreateHotelBookingDto) {
    const nights = dto.nights ?? 1;
    const rate = dto.rate ?? 0;
    return this.prisma.db.hotelBooking.create({
      data: {
        tenantId: this.ctx.tenantId!,
        bookingId,
        vendorId: dto.vendorId,
        hotelName: dto.hotelName,
        roomType: dto.roomType,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        rooms: dto.rooms ?? 1,
        nights,
        rate,
        total: rate * nights * (dto.rooms ?? 1),
      },
    });
  }

  updateHotelBooking(id: string, dto: UpdateBookingStatusDto) {
    return this.prisma.db.hotelBooking.update({
      where: { id },
      data: { status: dto.status as $Enums.HotelBookingStatus, confirmationNo: dto.confirmationNo },
    });
  }

  // ───────────────────────── Transport procurement ─────────────────────────

  listTransportBookings(bookingId: string) {
    return this.prisma.db.transportBooking.findMany({ where: { bookingId } });
  }

  createTransportBooking(bookingId: string, dto: CreateTransportBookingDto) {
    return this.prisma.db.transportBooking.create({
      data: {
        tenantId: this.ctx.tenantId!,
        bookingId,
        vendorId: dto.vendorId,
        vehicleType: dto.vehicleType as $Enums.VehicleType,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        pickup: dto.pickup,
        drop: dto.drop,
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : null,
        rate: dto.rate ?? 0,
        total: dto.rate ?? 0,
      } as Prisma.TransportBookingUncheckedCreateInput,
    });
  }

  updateTransportBooking(id: string, dto: UpdateBookingStatusDto) {
    return this.prisma.db.transportBooking.update({
      where: { id },
      data: { status: dto.status as $Enums.TransportBookingStatus },
    });
  }
}
