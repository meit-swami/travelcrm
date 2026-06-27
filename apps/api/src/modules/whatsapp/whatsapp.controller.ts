import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Can } from '../../core/rbac';
import { WhatsAppService } from './whatsapp.service';

class SendMessageDto {
  @IsString() body!: string;
}

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('conversations')
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get()
  @Can('conversation.read_own')
  list() {
    return this.whatsapp.listConversations();
  }

  @Get(':id/messages')
  @Can('conversation.read_own')
  messages(@Param('id') id: string) {
    return this.whatsapp.listMessages(id);
  }

  @Post(':id/messages')
  @Can('message.create')
  send(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.whatsapp.sendText(id, dto.body);
  }
}
