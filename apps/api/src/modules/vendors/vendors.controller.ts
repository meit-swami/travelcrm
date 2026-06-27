import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { VendorsService } from './vendors.service';
import {
  CreateHotelBookingDto,
  CreateTransportBookingDto,
  CreateVendorDto,
  CreateVendorRateDto,
  UpdateBookingStatusDto,
  VendorCommunicationDto,
} from './dto/vendors.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller()
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get('vendors')
  @Can('vendor.read')
  list(@Query('type') type?: string) {
    return this.vendors.listVendors(type);
  }

  @Post('vendors')
  @Can('vendor.create')
  create(@Body() dto: CreateVendorDto) {
    return this.vendors.createVendor(dto);
  }

  @Get('vendors/:id')
  @Can('vendor.read')
  get(@Param('id') id: string) {
    return this.vendors.getVendor(id);
  }

  @Get('vendors/:id/rates')
  @Can('vendor_rate.read')
  rates(@Param('id') id: string) {
    return this.vendors.listRates(id);
  }

  @Post('vendors/:id/rates')
  @Can('vendor_rate.create')
  addRate(@Param('id') id: string, @Body() dto: CreateVendorRateDto) {
    return this.vendors.addRate(id, dto);
  }

  @Post('vendors/:id/communications')
  @Can('vendor.update')
  addComm(@Param('id') id: string, @Body() dto: VendorCommunicationDto) {
    return this.vendors.addCommunication(id, dto);
  }

  // Hotel procurement
  @Get('bookings/:bookingId/hotel-bookings')
  @Can('hotel_booking.read')
  hotels(@Param('bookingId') bookingId: string) {
    return this.vendors.listHotelBookings(bookingId);
  }

  @Post('bookings/:bookingId/hotel-bookings')
  @Can('hotel_booking.create')
  addHotel(@Param('bookingId') bookingId: string, @Body() dto: CreateHotelBookingDto) {
    return this.vendors.createHotelBooking(bookingId, dto);
  }

  @Patch('hotel-bookings/:id')
  @Can('hotel_booking.update')
  updateHotel(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.vendors.updateHotelBooking(id, dto);
  }

  // Transport procurement
  @Get('bookings/:bookingId/transport-bookings')
  @Can('transport_booking.read')
  transports(@Param('bookingId') bookingId: string) {
    return this.vendors.listTransportBookings(bookingId);
  }

  @Post('bookings/:bookingId/transport-bookings')
  @Can('transport_booking.create')
  addTransport(@Param('bookingId') bookingId: string, @Body() dto: CreateTransportBookingDto) {
    return this.vendors.createTransportBooking(bookingId, dto);
  }

  @Patch('transport-bookings/:id')
  @Can('transport_booking.update')
  updateTransport(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.vendors.updateTransportBooking(id, dto);
  }
}
