import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../auth/token.service';
import { OtpNotifier } from '../auth/otp-notifier.service';
import { PortalAuthService } from './portal-auth.service';
import { PortalService } from './portal.service';
import { PortalGuard } from './portal.guard';
import { PortalController } from './portal.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [PortalController],
  providers: [PortalAuthService, PortalService, PortalGuard, TokenService, OtpNotifier],
})
export class PortalModule {}
