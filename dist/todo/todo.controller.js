"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoController = void 0;
const common_1 = require("@nestjs/common");
const todo_service_1 = require("./todo.service");
let TodoController = class TodoController {
    constructor(todoService) {
        this.todoService = todoService;
    }
    getTodos() {
        return this.todoService.getTodos();
    }
    getHistory() {
        return this.todoService.getHistory();
    }
    getTodosByDate(date) {
        return this.todoService.getTodosByDate(date);
    }
    completeTodoByDate(date, text) {
        return this.todoService.completeTodoByDate(date, text);
    }
    deleteTodoByDate(date, text, section) {
        return this.todoService.deleteTodoByDate(date, text, section);
    }
    addTodo(text, time, duration) {
        return this.todoService.addTodo(text, time, duration);
    }
    completeTodo(text) {
        return this.todoService.completeTodo(text);
    }
    updateTodoDuration(text, section, duration) {
        return this.todoService.updateTodoDuration(text, section, duration);
    }
    updateTodoTime(text, section, time) {
        return this.todoService.updateTodoTime(text, section, time);
    }
    deleteTodo(text, section) {
        return this.todoService.deleteTodo(text, section);
    }
};
exports.TodoController = TodoController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "getTodos", null);
__decorate([
    (0, common_1.Get)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('history/date'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "getTodosByDate", null);
__decorate([
    (0, common_1.Patch)('history/complete'),
    __param(0, (0, common_1.Body)('date')),
    __param(1, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "completeTodoByDate", null);
__decorate([
    (0, common_1.Delete)('history'),
    __param(0, (0, common_1.Body)('date')),
    __param(1, (0, common_1.Body)('text')),
    __param(2, (0, common_1.Body)('section')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "deleteTodoByDate", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('time')),
    __param(2, (0, common_1.Body)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "addTodo", null);
__decorate([
    (0, common_1.Patch)('complete'),
    __param(0, (0, common_1.Body)('text')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "completeTodo", null);
__decorate([
    (0, common_1.Patch)('duration'),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('section')),
    __param(2, (0, common_1.Body)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "updateTodoDuration", null);
__decorate([
    (0, common_1.Patch)('time'),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('section')),
    __param(2, (0, common_1.Body)('time')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "updateTodoTime", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('section')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TodoController.prototype, "deleteTodo", null);
exports.TodoController = TodoController = __decorate([
    (0, common_1.Controller)('todos'),
    __metadata("design:paramtypes", [todo_service_1.TodoService])
], TodoController);
//# sourceMappingURL=todo.controller.js.map