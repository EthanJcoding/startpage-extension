import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { JiraModule } from '../jira/jira.module';
import { GithubModule } from '../github/github.module';
import { TodoModule } from '../todo/todo.module';

@Module({
  imports: [JiraModule, GithubModule, TodoModule],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
