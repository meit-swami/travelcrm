import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { BookingsService } from './bookings.service';
import { AddOperationTaskDto, AdvanceStageDto, HandoverDto } from './dto/operations.dto';

@ApiTags('Operations')
@ApiBearerAuth()
@Controller('bookings')
export class OperationsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @Can('booking.read_own')
  list() {
    return this.bookings.list();
  }

  @Get(':id')
  @Can('booking.read_own')
  get(@Param('id') id: string) {
    return this.bookings.get(id);
  }

  @Post(':id/stage')
  @Can('booking.transition')
  advance(@Param('id') id: string, @Body() dto: AdvanceStageDto) {
    return this.bookings.advanceStage(id, dto);
  }

  @Post(':id/handover')
  @Can('booking.update')
  handover(@Param('id') id: string, @Body() dto: HandoverDto) {
    return this.bookings.handover(id, dto.opsOwnerUserId);
  }

  @Get(':id/tasks')
  @Can('operation_task.read_own')
  tasks(@Param('id') id: string) {
    return this.bookings.listTasks(id);
  }

  @Post(':id/tasks')
  @Can('operation_task.create')
  addTask(@Param('id') id: string, @Body() dto: AddOperationTaskDto) {
    return this.bookings.addTask(id, dto);
  }

  @Post('tasks/:taskId/complete')
  @Can('operation_task.update')
  completeTask(@Param('taskId') taskId: string) {
    return this.bookings.completeTask(taskId);
  }
}
