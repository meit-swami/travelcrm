import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadStage, LeadStatus } from '@travelos/types';

const STAGES = Object.values(LeadStage);
const STATUSES = Object.values(LeadStatus);

export class CreateLeadDto {
  @IsString() name!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() altPhone?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() travelDate?: string;
  @IsOptional() @IsString() returnDate?: string;
  @IsOptional() @IsInt() @Min(0) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsNumber() budgetAmount?: number;
  @IsOptional() @IsString() budgetCurrency?: string;
  @IsOptional() @IsString() hotelPreference?: string;
  @IsOptional() @IsBoolean() flightRequired?: boolean;
  @IsOptional() @IsString() specialRequests?: string;
  @IsOptional() @IsString() sourceId?: string;
  @IsOptional() @IsString() sourceLabel?: string;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsString() assignedTeamId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class ImportLeadsDto {
  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => CreateLeadDto)
  leads!: CreateLeadDto[];
}

export class UpdateLeadDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() altPhone?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() travelDate?: string;
  @IsOptional() @IsString() returnDate?: string;
  @IsOptional() @IsInt() @Min(0) adults?: number;
  @IsOptional() @IsInt() @Min(0) children?: number;
  @IsOptional() @IsNumber() budgetAmount?: number;
  @IsOptional() @IsString() budgetCurrency?: string;
  @IsOptional() @IsString() hotelPreference?: string;
  @IsOptional() @IsBoolean() flightRequired?: boolean;
  @IsOptional() @IsString() specialRequests?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class ListLeadsQuery {
  @IsOptional() @IsEnum(STAGES as [string, ...string[]]) stage?: string;
  @IsOptional() @IsEnum(STATUSES as [string, ...string[]]) status?: string;
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsInt() @Min(1) limit?: number;
  @IsOptional() @IsString() cursor?: string;
}

export class TransitionStageDto {
  @IsEnum(STAGES as [string, ...string[]]) stage!: string;
  @IsOptional() @IsString() reasonId?: string;
  @IsOptional() @IsString() reason?: string;
}

export class AssignLeadDto {
  @IsOptional() @IsString() assignedUserId?: string;
  @IsOptional() @IsString() assignedTeamId?: string;
}

export class CreateNoteDto {
  @IsString() body!: string;
  @IsOptional() @IsBoolean() isPinned?: boolean;
}
