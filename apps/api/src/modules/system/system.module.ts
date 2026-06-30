import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';

// AppConfigModule is @Global, so AppConfigService is injectable here directly.
@Module({
  controllers: [IntegrationsController],
})
export class SystemModule {}
