import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { OtpNotifier } from './otp-notifier.service';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokenService, OtpNotifier, AuthGuard],
  exports: [AuthService, TokenService, AuthGuard],
})
export class AuthModule {}
