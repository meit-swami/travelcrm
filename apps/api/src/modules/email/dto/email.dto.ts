import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

const TRIGGERS = [
  'quotation_sent',
  'payment_received',
  'invoice_generated',
  'voucher_generated',
  'travel_reminder',
  'feedback_request',
];

export class UpsertTemplateDto {
  @IsString() key!: string;
  @IsString() name!: string;
  @IsString() subject!: string;
  @IsString() htmlBody!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) variables?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateAutomationDto {
  @IsEnum(TRIGGERS as [string, ...string[]]) triggerEvent!: string;
  @IsString() templateKey!: string;
  @IsOptional() @IsInt() @Min(0) delayMinutes?: number;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
}
