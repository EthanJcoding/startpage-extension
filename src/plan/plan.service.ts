import { Injectable } from '@nestjs/common';
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

@Injectable()
export class PlanService {
  constructor(
    private readonly jiraService: JiraService,
    private readonly githubService: GithubService,
    private readonly todoService: TodoService,
  ) {}

  async getTodayPlan(): Promise<TodayPlan> {
    const [issues, myPrs, todos] = await Promise.all([
      this.jiraService.getMyIssues(),
      this.githubService.getMyPullRequests(),
      this.todoService.getTodos(),
    ]);

    const morningCandidates: PlanItem[] = [];
    const afternoonCandidates: PlanItem[] = [];

    for (const issue of issues) {
      const priority = (issue.priority || '').toLowerCase();
      const status = (issue.status || '').toLowerCase();
      const highPriority =
        priority.includes('high') ||
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
      const base: PlanItem = {
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
      } else {
        afternoonCandidates.push(base);
      }
    }

    const uniqTop = (items: PlanItem[]) => {
      const seen = new Set<string>();
      return items
        .sort((a, b) => b.score - a.score)
        .filter((item) => {
          const key = `${item.source}:${item.title}`;
          if (seen.has(key)) return false;
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
}
