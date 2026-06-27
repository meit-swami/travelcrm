import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

const TASK_TYPES = ['call', 'follow_up', 'email', 'whatsapp', 'meeting', 'custom'];
const TASK_STATUSES = ['pending', 'in_progress', 'done', 'cancelled'];

export class CreateTaskDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TASK_TYPES as [string, ...string[]]) type?: string;
  @IsOptional() @IsString() leadId?: string;
  @IsOptional() @IsString() dueAt?: string;
  @IsOptional() @IsString() remindAt?: string;
  @IsOptional() @IsString() assigneeUserId?: string;
}

export class ListTasksQuery {
  @IsOptional() @IsBoolean() mine?: boolean;
  @IsOptional() @IsString() assigneeUserId?: string;
  @IsOptional() @IsEnum(TASK_STATUSES as [string, ...string[]]) status?: string;
  @IsOptional() @IsString() leadId?: string;
}
