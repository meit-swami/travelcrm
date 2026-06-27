import { IsString, Length } from 'class-validator';

export class PortalOtpDto {
  @IsString() tenantSlug!: string;
  @IsString() phone!: string;
}

export class PortalVerifyDto {
  @IsString() tenantSlug!: string;
  @IsString() phone!: string;
  @IsString() @Length(4, 8) code!: string;
}
