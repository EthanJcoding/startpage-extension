import { Controller, Get, Post, Patch, Delete, Body, Query } from '@nestjs/common';
import { TodoService } from './todo.service';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  getTodos() {
    return this.todoService.getTodos();
  }

  @Get('history')
  getHistory() {
    return this.todoService.getHistory();
  }

  @Get('history/date')
  getTodosByDate(@Query('date') date: string) {
    return this.todoService.getTodosByDate(date);
  }

  @Patch('history/complete')
  completeTodoByDate(@Body('date') date: string, @Body('text') text: string) {
    return this.todoService.completeTodoByDate(date, text);
  }

  @Delete('history')
  deleteTodoByDate(
    @Body('date') date: string,
    @Body('text') text: string,
    @Body('section') section: 'inProgress' | 'done',
  ) {
    return this.todoService.deleteTodoByDate(date, text, section);
  }

  @Post()
  addTodo(@Body('text') text: string, @Body('time') time?: string, @Body('duration') duration?: string) {
    return this.todoService.addTodo(text, time, duration);
  }

  @Patch('complete')
  completeTodo(@Body('text') text: string) {
    return this.todoService.completeTodo(text);
  }

  @Patch('duration')
  updateTodoDuration(
    @Body('text') text: string,
    @Body('section') section: 'inProgress' | 'done',
    @Body('duration') duration: string,
  ) {
    return this.todoService.updateTodoDuration(text, section, duration);
  }

  @Patch('time')
  updateTodoTime(
    @Body('text') text: string,
    @Body('section') section: 'inProgress' | 'done',
    @Body('time') time?: string,
  ) {
    return this.todoService.updateTodoTime(text, section, time);
  }

  @Delete()
  deleteTodo(@Body('text') text: string, @Body('section') section: 'inProgress' | 'done') {
    return this.todoService.deleteTodo(text, section);
  }
}
