import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

const VENDOR_TYPES = ['hotel', 'transport', 'activity', 'other'];
const VEHICLE_TYPES = ['taxi', 'tempo_traveller', 'coach', 'other'];
const HOTEL_STATUSES = ['requested', 'quoted', 'confirmed', 'cancelled'];

export class CreateVendorDto {
  @IsEnum(VENDOR_TYPES as [string, ...string[]]) type!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
}

export class CreateVendorRateDto {
  @IsString() label!: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsNumber() contractRate?: number;
  @IsOptional() @IsNumber() negotiatedRate?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() season?: string;
}

export class VendorCommunicationDto {
  @IsString() channel!: string;
  @IsString() direction!: string;
  @IsOptional() @IsString() bookingId?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() body?: string;
}

export class CreateHotelBookingDto {
  @IsString() hotelName!: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() roomType?: string;
  @IsOptional() @IsString() checkIn?: string;
  @IsOptional() @IsString() checkOut?: string;
  @IsOptional() @IsNumber() rooms?: number;
  @IsOptional() @IsNumber() nights?: number;
  @IsOptional() @IsNumber() rate?: number;
}

export class CreateTransportBookingDto {
  @IsEnum(VEHICLE_TYPES as [string, ...string[]]) vehicleType!: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsString() driverName?: string;
  @IsOptional() @IsString() driverPhone?: string;
  @IsOptional() @IsString() pickup?: string;
  @IsOptional() @IsString() drop?: string;
  @IsOptional() @IsString() serviceDate?: string;
  @IsOptional() @IsNumber() rate?: number;
}

export class UpdateBookingStatusDto {
  @IsEnum(HOTEL_STATUSES as [string, ...string[]]) status!: string;
  @IsOptional() @IsString() confirmationNo?: string;
}
