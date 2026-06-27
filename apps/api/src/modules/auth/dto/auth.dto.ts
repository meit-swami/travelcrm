import { IsEmail, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  tenantSlug!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  totp?: string;
}

export class RequestOtpDto {
  @IsString()
  tenantSlug!: string;

  @IsString()
  identifier!: string; // phone (E.164) or email

  @IsOptional()
  @IsIn(['sms', 'whatsapp', 'email'])
  channel?: 'sms' | 'whatsapp' | 'email';
}

export class VerifyOtpDto {
  @IsString()
  tenantSlug!: string;

  @IsString()
  identifier!: string;

  @IsString()
  @Length(4, 8)
  code!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
