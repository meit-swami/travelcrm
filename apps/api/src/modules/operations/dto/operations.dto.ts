import { IsEnum, IsOptional, IsString } from 'class-validator';

const OPS_STAGES = [
  'confirmed',
  'hotel_procurement',
  'transport_procurement',
  'voucher_generation',
  'final_itinerary',
  'delivered',
  'completed',
  'cancelled',
];

export class AdvanceStageDto {
  @IsEnum(OPS_STAGES as [string, ...string[]]) stage!: string;
}

export class HandoverDto {
  @IsString() opsOwnerUserId!: string;
}

export class AddOperationTaskDto {
  @IsEnum(OPS_STAGES as [string, ...string[]]) stage!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() assigneeUserId?: string;
  @IsOptional() @IsString() dueAt?: string;
}
