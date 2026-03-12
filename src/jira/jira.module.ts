import { Module } from '@nestjs/common';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [JiraService],
  controllers: [JiraController],
  exports: [JiraService],
})
export class JiraModule {}
