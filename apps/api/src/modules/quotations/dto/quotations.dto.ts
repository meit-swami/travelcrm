import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LineItemDto {
  @IsString() description!: string;
  @IsNumber() @Min(0) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreateQuotationDto {
  @IsString() title!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) lineItems!: LineItemDto[];
  @IsOptional() @IsNumber() @Min(0) tax?: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
}

export class AddVersionDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LineItemDto) lineItems!: LineItemDto[];
  @IsOptional() @IsNumber() @Min(0) tax?: number;
  @IsOptional() @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsString() notes?: string;
}

export class RejectQuotationDto {
  @IsString() reason!: string;
}
