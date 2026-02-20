import { ConfigService } from '@nestjs/config';
export interface Todo {
    id: string;
    text: string;
    done: boolean;
    section: 'inProgress' | 'done';
    time?: string;
    duration?: string;
}
export interface TodoResult {
    inProgress: Todo[];
    done: Todo[];
}
export declare class TodoService {
    private configService;
    private readonly dataDir;
    constructor(configService: ConfigService);
    private get filePath();
    private filePathForDate;
    private ensureFile;
    private parseTodos;
    private serialize;
    getTodos(): Promise<TodoResult>;
    addTodo(text: string, time?: string, duration?: string): Promise<TodoResult>;
    completeTodo(text: string): Promise<TodoResult>;
    updateTodoDuration(text: string, section: 'inProgress' | 'done', duration: string): Promise<TodoResult>;
    updateTodoTime(text: string, section: 'inProgress' | 'done', time?: string): Promise<TodoResult>;
    getHistory(limit?: number): Promise<{
        date: string;
        inProgress: number;
        done: number;
    }[]>;
    getTodosByDate(date: string): Promise<TodoResult & {
        date: string;
    }>;
    completeTodoByDate(date: string, text: string): Promise<TodoResult & {
        date: string;
    }>;
    deleteTodoByDate(date: string, text: string, section: 'inProgress' | 'done'): Promise<TodoResult & {
        date: string;
    }>;
    deleteTodo(text: string, section: 'inProgress' | 'done'): Promise<TodoResult>;
}
