import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { JiraModule } from './jira/jira.module';
import { GithubModule } from './github/github.module';
import { WeatherModule } from './weather/weather.module';
import { LunchModule } from './lunch/lunch.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TodoModule,
    JiraModule,
    GithubModule,
    WeatherModule,
    LunchModule,
  ],
})
export class AppModule {}
