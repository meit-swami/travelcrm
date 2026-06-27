import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const PAYMENT_TYPES = ['advance', 'partial', 'final'];
const GATEWAYS = ['razorpay', 'cashfree', 'manual', 'bank_transfer', 'cash'];

export class CreateInvoiceDto {
  @IsOptional() @IsArray() lineItems?: { description: string; amount: number }[];
  @IsOptional() @IsNumber() tax?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() dueDate?: string;
}

export class RecordPaymentDto {
  @IsNumber() @Min(0) amount!: number;
  @IsOptional() @IsEnum(PAYMENT_TYPES as [string, ...string[]]) type?: string;
  @IsOptional() @IsEnum(GATEWAYS as [string, ...string[]]) gateway?: string;
  @IsOptional() @IsString() invoiceId?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() currency?: string;
}
