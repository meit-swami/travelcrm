import { IsEmail, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

/** Flexible payload accepted from external lead sources. */
export class CaptureLeadDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() travelDate?: string;
  @IsOptional() @IsInt() @Min(0) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsNumber() budgetAmount?: number;
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsString() secret?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
