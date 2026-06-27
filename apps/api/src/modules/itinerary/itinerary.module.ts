import { Module } from '@nestjs/common';
import { ItineraryBuilderProvider } from '../../integrations/itinerary/itinerary.provider';
import { ItineraryService } from './itinerary.service';
import { ItineraryController } from './itinerary.controller';
import { ItineraryWebhookController } from '../../webhooks/itinerary.controller';

@Module({
  controllers: [ItineraryController, ItineraryWebhookController],
  providers: [ItineraryService, ItineraryBuilderProvider],
  exports: [ItineraryService],
})
export class ItineraryModule {}
