import { TodoService } from './todo.service';
export declare class TodoController {
    private readonly todoService;
    constructor(todoService: TodoService);
    getTodos(): Promise<import("./todo.service").TodoResult>;
    getHistory(): Promise<{
        date: string;
        inProgress: number;
        done: number;
    }[]>;
    getTodosByDate(date: string): Promise<import("./todo.service").TodoResult & {
        date: string;
    }>;
    completeTodoByDate(date: string, text: string): Promise<import("./todo.service").TodoResult & {
        date: string;
    }>;
    deleteTodoByDate(date: string, text: string, section: 'inProgress' | 'done'): Promise<import("./todo.service").TodoResult & {
        date: string;
    }>;
    addTodo(text: string, time?: string, duration?: string): Promise<import("./todo.service").TodoResult>;
    completeTodo(text: string): Promise<import("./todo.service").TodoResult>;
    updateTodoDuration(text: string, section: 'inProgress' | 'done', duration: string): Promise<import("./todo.service").TodoResult>;
    updateTodoTime(text: string, section: 'inProgress' | 'done', time?: string): Promise<import("./todo.service").TodoResult>;
    deleteTodo(text: string, section: 'inProgress' | 'done'): Promise<import("./todo.service").TodoResult>;
}
