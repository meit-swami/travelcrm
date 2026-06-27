import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

const PROVIDERS = ['exotel', 'knowlarity', 'manual'];
const DIRECTIONS = ['inbound', 'outbound'];
const STATUSES = ['ringing', 'answered', 'missed', 'busy', 'failed', 'completed'];

export class LogCallDto {
  @IsEnum(DIRECTIONS as [string, ...string[]]) direction!: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsEnum(PROVIDERS as [string, ...string[]]) provider?: string;
  @IsOptional() @IsString() fromNumber?: string;
  @IsOptional() @IsString() toNumber?: string;
  @IsOptional() @IsEnum(STATUSES as [string, ...string[]]) status?: string;
  @IsOptional() @IsInt() @Min(0) durationSec?: number;
  @IsOptional() @IsString() startedAt?: string;
  @IsOptional() @IsString() notes?: string;
}
