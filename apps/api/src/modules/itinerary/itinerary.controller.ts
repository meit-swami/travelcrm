import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { ItineraryService } from './itinerary.service';
import { ImportItineraryDto } from './dto/itinerary.dto';

@ApiTags('Itinerary')
@ApiBearerAuth()
@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itinerary: ItineraryService) {}

  @Post('import')
  @Can('itinerary.create')
  import(@Body() dto: ImportItineraryDto) {
    return this.itinerary.import(dto);
  }

  @Get(':id')
  @Can('itinerary.read')
  get(@Param('id') id: string) {
    return this.itinerary.get(id);
  }

  @Get(':id/versions')
  @Can('itinerary.read')
  versions(@Param('id') id: string) {
    return this.itinerary.listVersions(id);
  }

  @Post(':id/sync')
  @Can('itinerary.update')
  sync(@Param('id') id: string) {
    return this.itinerary.sync(id);
  }
}
