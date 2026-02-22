import { JiraService } from '../jira/jira.service';
import { GithubService } from '../github/github.service';
import { TodoService } from '../todo/todo.service';
export interface PlanItem {
    source: 'jira' | 'github' | 'todo';
    title: string;
    subtitle: string;
    score: number;
    reason: string;
}
export interface TodayPlan {
    morning: PlanItem[];
    afternoon: PlanItem[];
    generatedAt: string;
}
export declare class PlanService {
    private readonly jiraService;
    private readonly githubService;
    private readonly todoService;
    constructor(jiraService: JiraService, githubService: GithubService, todoService: TodoService);
    getTodayPlan(): Promise<TodayPlan>;
}
