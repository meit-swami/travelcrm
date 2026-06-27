import { IsEnum, IsOptional, IsString } from 'class-validator';

const VOUCHER_TYPES = ['customer', 'hotel', 'transport', 'vendor'];

export class GenerateVoucherDto {
  @IsEnum(VOUCHER_TYPES as [string, ...string[]]) type!: string;
  @IsOptional() @IsString() issuedTo?: string;
}
