import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ListTasksQuery } from './dto/tasks.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @Can('task.read_own')
  list(@Query() query: ListTasksQuery) {
    return this.tasks.list(query);
  }

  @Post()
  @Can('task.create')
  create(@Body() dto: CreateTaskDto) {
    return this.tasks.create(dto);
  }

  @Post(':id/complete')
  @Can('task.update')
  complete(@Param('id') id: string) {
    return this.tasks.complete(id);
  }
}
