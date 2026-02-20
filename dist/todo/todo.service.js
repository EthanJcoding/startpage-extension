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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
let TodoService = class TodoService {
    constructor(configService) {
        this.configService = configService;
        this.dataDir =
            this.configService.get('DATA_DIR') ||
                '/Users/ethanjeong/Documents/Obsidian Vault/002-TODOS';
    }
    get filePath() {
        return this.filePathForDate(new Date());
    }
    filePathForDate(d) {
        if (typeof d === 'string') {
            const [y, m, dd] = d.split('-');
            return (0, path_1.join)(this.dataDir, `${y.slice(-2)}-${m}-${dd} todos.md`);
        }
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return (0, path_1.join)(this.dataDir, `${yy}-${mm}-${dd} todos.md`);
    }
    async ensureFile() {
        if (!(0, fs_1.existsSync)(this.filePath)) {
            const dir = (0, path_1.dirname)(this.filePath);
            if (!(0, fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            const template = `# Todos\n\n## In Progress\n\n## Done\n`;
            await (0, promises_1.writeFile)(this.filePath, template, 'utf-8');
        }
    }
    parseTodos(content) {
        const inProgress = [];
        const done = [];
        let currentSection = null;
        let index = 0;
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '## In Progress') {
                currentSection = 'inProgress';
                continue;
            }
            if (trimmed === '## Done') {
                currentSection = 'done';
                continue;
            }
            if (currentSection === 'inProgress' && trimmed.startsWith('- [ ] ')) {
                const raw = trimmed.slice(6);
                const m = raw.match(/^(?:\[(\d{2}:\d{2})\]\s*)?(?:\((\d{2}:\d{2})\)\s*)?/);
                const time = m[1] || undefined;
                const duration = m[2] || undefined;
                const text = raw.slice(m[0].length);
                inProgress.push({ id: `todo-${index}`, text, done: false, section: 'inProgress', time, duration });
                index++;
            }
            else if (currentSection === 'done' && trimmed.startsWith('- [x] ')) {
                const raw = trimmed.slice(6);
                const m = raw.match(/^(?:\[(\d{2}:\d{2})\]\s*)?(?:\((\d{2}:\d{2})\)\s*)?/);
                const time = m[1] || undefined;
                const duration = m[2] || undefined;
                const text = raw.slice(m[0].length);
                done.push({ id: `todo-${index}`, text, done: true, section: 'done', time, duration });
                index++;
            }
        }
        return { inProgress, done };
    }
    serialize(todos) {
        let content = '# Todos\n\n## In Progress\n';
        for (const todo of todos.inProgress) {
            let prefix = '';
            if (todo.time)
                prefix += `[${todo.time}]`;
            if (todo.duration)
                prefix += `(${todo.duration})`;
            if (prefix)
                prefix += ' ';
            content += `- [ ] ${prefix}${todo.text}\n`;
        }
        content += '\n## Done\n';
        for (const todo of todos.done) {
            let prefix = '';
            if (todo.time)
                prefix += `[${todo.time}]`;
            if (todo.duration)
                prefix += `(${todo.duration})`;
            if (prefix)
                prefix += ' ';
            content += `- [x] ${prefix}${todo.text}\n`;
        }
        return content;
    }
    async getTodos() {
        await this.ensureFile();
        const content = await (0, promises_1.readFile)(this.filePath, 'utf-8');
        return this.parseTodos(content);
    }
    async addTodo(text, time, duration) {
        const todos = await this.getTodos();
        todos.inProgress.push({
            id: `todo-${todos.inProgress.length + todos.done.length}`,
            text,
            done: false,
            section: 'inProgress',
            time,
            duration,
        });
        await (0, promises_1.writeFile)(this.filePath, this.serialize(todos), 'utf-8');
        return this.getTodos();
    }
    async completeTodo(text) {
        const todos = await this.getTodos();
        const idx = todos.inProgress.findIndex((t) => t.text === text);
        if (idx !== -1) {
            const [moved] = todos.inProgress.splice(idx, 1);
            todos.done.push({ ...moved, done: true, section: 'done' });
            await (0, promises_1.writeFile)(this.filePath, this.serialize(todos), 'utf-8');
        }
        return this.getTodos();
    }
    async updateTodoDuration(text, section, duration) {
        const todos = await this.getTodos();
        const list = section === 'inProgress' ? todos.inProgress : todos.done;
        const todo = list.find((t) => t.text === text);
        if (todo) {
            todo.duration = duration || undefined;
        }
        await (0, promises_1.writeFile)(this.filePath, this.serialize(todos), 'utf-8');
        return this.getTodos();
    }
    async updateTodoTime(text, section, time) {
        const todos = await this.getTodos();
        const list = section === 'inProgress' ? todos.inProgress : todos.done;
        const todo = list.find((t) => t.text === text);
        if (todo) {
            todo.time = time || undefined;
        }
        await (0, promises_1.writeFile)(this.filePath, this.serialize(todos), 'utf-8');
        return this.getTodos();
    }
    async getHistory(limit = 14) {
        const dir = this.dataDir;
        if (!(0, fs_1.existsSync)(dir))
            return [];
        const files = await (0, promises_1.readdir)(dir);
        const todoFiles = files
            .filter((f) => /^\d{2}-\d{2}-\d{2} todos\.md$/.test(f))
            .sort()
            .reverse()
            .slice(0, limit);
        const result = [];
        for (const file of todoFiles) {
            const match = file.match(/^(\d{2})-(\d{2})-(\d{2}) todos\.md$/);
            if (!match)
                continue;
            const dateStr = `20${match[1]}-${match[2]}-${match[3]}`;
            const content = await (0, promises_1.readFile)((0, path_1.join)(dir, file), 'utf-8');
            const todos = this.parseTodos(content);
            result.push({ date: dateStr, inProgress: todos.inProgress.length, done: todos.done.length });
        }
        return result;
    }
    async getTodosByDate(date) {
        const [y, m, d] = date.split('-');
        const yy = y.slice(-2);
        const filePath = (0, path_1.join)(this.dataDir, `${yy}-${m}-${d} todos.md`);
        if (!(0, fs_1.existsSync)(filePath))
            return { date, inProgress: [], done: [] };
        const content = await (0, promises_1.readFile)(filePath, 'utf-8');
        return { date, ...this.parseTodos(content) };
    }
    async completeTodoByDate(date, text) {
        const fp = this.filePathForDate(date);
        if (!(0, fs_1.existsSync)(fp))
            return { date, inProgress: [], done: [] };
        const content = await (0, promises_1.readFile)(fp, 'utf-8');
        const todos = this.parseTodos(content);
        const idx = todos.inProgress.findIndex((t) => t.text === text);
        if (idx !== -1) {
            const [moved] = todos.inProgress.splice(idx, 1);
            todos.done.push({ ...moved, done: true, section: 'done' });
            await (0, promises_1.writeFile)(fp, this.serialize(todos), 'utf-8');
        }
        const updated = this.parseTodos(await (0, promises_1.readFile)(fp, 'utf-8'));
        return { date, ...updated };
    }
    async deleteTodoByDate(date, text, section) {
        const fp = this.filePathForDate(date);
        if (!(0, fs_1.existsSync)(fp))
            return { date, inProgress: [], done: [] };
        const content = await (0, promises_1.readFile)(fp, 'utf-8');
        const todos = this.parseTodos(content);
        if (section === 'inProgress') {
            todos.inProgress = todos.inProgress.filter((t) => t.text !== text);
        }
        else {
            todos.done = todos.done.filter((t) => t.text !== text);
        }
        await (0, promises_1.writeFile)(fp, this.serialize(todos), 'utf-8');
        const updated = this.parseTodos(await (0, promises_1.readFile)(fp, 'utf-8'));
        return { date, ...updated };
    }
    async deleteTodo(text, section) {
        const todos = await this.getTodos();
        if (section === 'inProgress') {
            todos.inProgress = todos.inProgress.filter((t) => t.text !== text);
        }
        else {
            todos.done = todos.done.filter((t) => t.text !== text);
        }
        await (0, promises_1.writeFile)(this.filePath, this.serialize(todos), 'utf-8');
        return this.getTodos();
    }
};
exports.TodoService = TodoService;
exports.TodoService = TodoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TodoService);
//# sourceMappingURL=todo.service.js.map