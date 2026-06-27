import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

const SOURCE_TYPES = [
  'website',
  'landing_page',
  'contact_form',
  'manual',
  'whatsapp',
  'facebook_ads',
  'instagram_ads',
  'google_forms',
  'referral',
  'import',
];
const STRATEGIES = ['round_robin', 'team', 'destination', 'load_balanced', 'manual'];

export class CreateSourceDto {
  @IsEnum(SOURCE_TYPES as [string, ...string[]]) type!: string;
  @IsString() name!: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsOptional() @IsBoolean() requireSecret?: boolean;
}

export class CreateAssignmentRuleDto {
  @IsString() name!: string;
  @IsEnum(STRATEGIES as [string, ...string[]]) strategy!: string;
  @IsOptional() @IsObject() conditions?: Record<string, unknown>;
  @IsOptional() @IsString() targetTeamId?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) targetUserIds?: string[];
  @IsOptional() @IsInt() priority?: number;
}
