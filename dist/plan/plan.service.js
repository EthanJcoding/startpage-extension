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
exports.PlanService = void 0;
const common_1 = require("@nestjs/common");
const jira_service_1 = require("../jira/jira.service");
const github_service_1 = require("../github/github.service");
const todo_service_1 = require("../todo/todo.service");
let PlanService = class PlanService {
    constructor(jiraService, githubService, todoService) {
        this.jiraService = jiraService;
        this.githubService = githubService;
        this.todoService = todoService;
    }
    async getTodayPlan() {
        const [issues, myPrs, todos] = await Promise.all([
            this.jiraService.getMyIssues(),
            this.githubService.getMyPullRequests(),
            this.todoService.getTodos(),
        ]);
        const morningCandidates = [];
        const afternoonCandidates = [];
        for (const issue of issues) {
            const priority = (issue.priority || '').toLowerCase();
            const status = (issue.status || '').toLowerCase();
            const highPriority = priority.includes('high') ||
                priority.includes('highest') ||
                priority.includes('critical') ||
                priority.includes('major');
            const inProgress = status.includes('progress') || status.includes('진행');
            const score = (highPriority ? 80 : 55) + (inProgress ? 15 : 0);
            morningCandidates.push({
                source: 'jira',
                title: `[${issue.key}] ${issue.summary}`,
                subtitle: `${issue.status} · ${issue.priority}`,
                score,
                reason: highPriority && inProgress ? '고우선순위 + 진행 중 이슈' : '오늘 처리할 Jira 이슈',
            });
        }
        const now = Date.now();
        for (const pr of myPrs) {
            const ageHours = Math.floor((now - new Date(pr.created_at).getTime()) / 3600000);
            const score = Math.min(85, 45 + Math.floor(ageHours / 8) * 5);
            morningCandidates.push({
                source: 'github',
                title: `#${pr.number} ${pr.title}`,
                subtitle: `${ageHours}시간 경과`,
                score,
                reason: '오래 열린 내 PR 우선 확인',
            });
        }
        for (const todo of todos.inProgress) {
            const hasTime = !!todo.time;
            const base = {
                source: 'todo',
                title: todo.text,
                subtitle: todo.time ? `${todo.time}${todo.duration ? ` · ${todo.duration}` : ''}` : '시간 미지정',
                score: hasTime ? 58 : 70,
                reason: hasTime ? '일정 기반 실행 항목' : '시간 미지정 할 일은 오후 블록 배치',
            };
            if (!hasTime) {
                afternoonCandidates.push(base);
                continue;
            }
            const hour = parseInt(todo.time.split(':')[0], 10);
            if (!isNaN(hour) && hour < 12) {
                morningCandidates.push(base);
            }
            else {
                afternoonCandidates.push(base);
            }
        }
        const uniqTop = (items) => {
            const seen = new Set();
            return items
                .sort((a, b) => b.score - a.score)
                .filter((item) => {
                const key = `${item.source}:${item.title}`;
                if (seen.has(key))
                    return false;
                seen.add(key);
                return true;
            })
                .slice(0, 3);
        };
        return {
            morning: uniqTop(morningCandidates),
            afternoon: uniqTop(afternoonCandidates),
            generatedAt: new Date().toISOString(),
        };
    }
};
exports.PlanService = PlanService;
exports.PlanService = PlanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jira_service_1.JiraService,
        github_service_1.GithubService,
        todo_service_1.TodoService])
], PlanService);
//# sourceMappingURL=plan.service.js.map