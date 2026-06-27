import { IsOptional, IsString } from 'class-validator';

export class ImportItineraryDto {
  @IsString() externalId!: string;
  @IsOptional() @IsString() leadId?: string;
}
