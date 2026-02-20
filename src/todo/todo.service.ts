import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

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

@Injectable()
export class TodoService {
  private readonly dataDir: string;

  constructor(private configService: ConfigService) {
    this.dataDir =
      this.configService.get<string>('DATA_DIR') ||
      '/Users/ethanjeong/Documents/Obsidian Vault/002-TODOS';
  }

  private get filePath(): string {
    return this.filePathForDate(new Date());
  }

  private filePathForDate(d: Date | string): string {
    if (typeof d === 'string') {
      const [y, m, dd] = d.split('-');
      return join(this.dataDir, `${y.slice(-2)}-${m}-${dd} todos.md`);
    }
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return join(this.dataDir, `${yy}-${mm}-${dd} todos.md`);
  }

  private async ensureFile(): Promise<void> {
    if (!existsSync(this.filePath)) {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      const template = `# Todos\n\n## In Progress\n\n## Done\n`;
      await writeFile(this.filePath, template, 'utf-8');
    }
  }

  private parseTodos(content: string): TodoResult {
    const inProgress: Todo[] = [];
    const done: Todo[] = [];

    let currentSection: 'inProgress' | 'done' | null = null;
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
      } else if (currentSection === 'done' && trimmed.startsWith('- [x] ')) {
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

  private serialize(todos: TodoResult): string {
    let content = '# Todos\n\n## In Progress\n';
    for (const todo of todos.inProgress) {
      let prefix = '';
      if (todo.time) prefix += `[${todo.time}]`;
      if (todo.duration) prefix += `(${todo.duration})`;
      if (prefix) prefix += ' ';
      content += `- [ ] ${prefix}${todo.text}\n`;
    }
    content += '\n## Done\n';
    for (const todo of todos.done) {
      let prefix = '';
      if (todo.time) prefix += `[${todo.time}]`;
      if (todo.duration) prefix += `(${todo.duration})`;
      if (prefix) prefix += ' ';
      content += `- [x] ${prefix}${todo.text}\n`;
    }
    return content;
  }

  async getTodos(): Promise<TodoResult> {
    await this.ensureFile();
    const content = await readFile(this.filePath, 'utf-8');
    return this.parseTodos(content);
  }

  async addTodo(text: string, time?: string, duration?: string): Promise<TodoResult> {
    const todos = await this.getTodos();
    todos.inProgress.push({
      id: `todo-${todos.inProgress.length + todos.done.length}`,
      text,
      done: false,
      section: 'inProgress',
      time,
      duration,
    });
    await writeFile(this.filePath, this.serialize(todos), 'utf-8');
    return this.getTodos();
  }

  async completeTodo(text: string): Promise<TodoResult> {
    const todos = await this.getTodos();
    const idx = todos.inProgress.findIndex((t) => t.text === text);
    if (idx !== -1) {
      const [moved] = todos.inProgress.splice(idx, 1);
      todos.done.push({ ...moved, done: true, section: 'done' });
      await writeFile(this.filePath, this.serialize(todos), 'utf-8');
    }
    return this.getTodos();
  }

  async updateTodoDuration(
    text: string,
    section: 'inProgress' | 'done',
    duration: string,
  ): Promise<TodoResult> {
    const todos = await this.getTodos();
    const list = section === 'inProgress' ? todos.inProgress : todos.done;
    const todo = list.find((t) => t.text === text);
    if (todo) {
      todo.duration = duration || undefined;
    }
    await writeFile(this.filePath, this.serialize(todos), 'utf-8');
    return this.getTodos();
  }

  async updateTodoTime(
    text: string,
    section: 'inProgress' | 'done',
    time?: string,
  ): Promise<TodoResult> {
    const todos = await this.getTodos();
    const list = section === 'inProgress' ? todos.inProgress : todos.done;
    const todo = list.find((t) => t.text === text);
    if (todo) {
      todo.time = time || undefined;
    }
    await writeFile(this.filePath, this.serialize(todos), 'utf-8');
    return this.getTodos();
  }

  async getHistory(limit = 14): Promise<{ date: string; inProgress: number; done: number }[]> {
    const dir = this.dataDir;
    if (!existsSync(dir)) return [];
    const files = await readdir(dir);
    const todoFiles = files
      .filter((f) => /^\d{2}-\d{2}-\d{2} todos\.md$/.test(f))
      .sort()
      .reverse()
      .slice(0, limit);

    const result: { date: string; inProgress: number; done: number }[] = [];
    for (const file of todoFiles) {
      const match = file.match(/^(\d{2})-(\d{2})-(\d{2}) todos\.md$/);
      if (!match) continue;
      const dateStr = `20${match[1]}-${match[2]}-${match[3]}`;
      const content = await readFile(join(dir, file), 'utf-8');
      const todos = this.parseTodos(content);
      result.push({ date: dateStr, inProgress: todos.inProgress.length, done: todos.done.length });
    }
    return result;
  }

  async getTodosByDate(date: string): Promise<TodoResult & { date: string }> {
    const [y, m, d] = date.split('-');
    const yy = y.slice(-2);
    const filePath = join(this.dataDir, `${yy}-${m}-${d} todos.md`);
    if (!existsSync(filePath)) return { date, inProgress: [], done: [] };
    const content = await readFile(filePath, 'utf-8');
    return { date, ...this.parseTodos(content) };
  }

  async completeTodoByDate(date: string, text: string): Promise<TodoResult & { date: string }> {
    const fp = this.filePathForDate(date);
    if (!existsSync(fp)) return { date, inProgress: [], done: [] };
    const content = await readFile(fp, 'utf-8');
    const todos = this.parseTodos(content);
    const idx = todos.inProgress.findIndex((t) => t.text === text);
    if (idx !== -1) {
      const [moved] = todos.inProgress.splice(idx, 1);
      todos.done.push({ ...moved, done: true, section: 'done' });
      await writeFile(fp, this.serialize(todos), 'utf-8');
    }
    const updated = this.parseTodos(await readFile(fp, 'utf-8'));
    return { date, ...updated };
  }

  async deleteTodoByDate(date: string, text: string, section: 'inProgress' | 'done'): Promise<TodoResult & { date: string }> {
    const fp = this.filePathForDate(date);
    if (!existsSync(fp)) return { date, inProgress: [], done: [] };
    const content = await readFile(fp, 'utf-8');
    const todos = this.parseTodos(content);
    if (section === 'inProgress') {
      todos.inProgress = todos.inProgress.filter((t) => t.text !== text);
    } else {
      todos.done = todos.done.filter((t) => t.text !== text);
    }
    await writeFile(fp, this.serialize(todos), 'utf-8');
    const updated = this.parseTodos(await readFile(fp, 'utf-8'));
    return { date, ...updated };
  }

  async deleteTodo(text: string, section: 'inProgress' | 'done'): Promise<TodoResult> {
    const todos = await this.getTodos();
    if (section === 'inProgress') {
      todos.inProgress = todos.inProgress.filter((t) => t.text !== text);
    } else {
      todos.done = todos.done.filter((t) => t.text !== text);
    }
    await writeFile(this.filePath, this.serialize(todos), 'utf-8');
    return this.getTodos();
  }
}
