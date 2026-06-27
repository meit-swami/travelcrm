import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/users.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Can('user.read')
  list() {
    return this.users.list();
  }

  @Post()
  @Can('user.create')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }
}
