import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
}

@Injectable()
export class JiraService {
  private readonly fallbackBaseUrl: string;
  private readonly fallbackAuthHeader: string;
  private readonly fallbackProjectKey: string;

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {
    this.fallbackBaseUrl = this.configService.get<string>('JIRA_BASE_URL') || '';
    const email = this.configService.get<string>('JIRA_EMAIL') || '';
    const token = this.configService.get<string>('JIRA_API_TOKEN') || '';
    this.fallbackAuthHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
    this.fallbackProjectKey = this.configService.get<string>('JIRA_PROJECT_KEY') || '';
  }

  private async getConfig() {
    const settings = await this.settingsService.getSettings();
    const jira = settings.jira;
    if (jira.baseUrl && jira.email && jira.apiToken) {
      return {
        baseUrl: jira.baseUrl,
        authHeader: `Basic ${Buffer.from(`${jira.email}:${jira.apiToken}`).toString('base64')}`,
        projectKey: jira.projectKey || this.fallbackProjectKey,
      };
    }
    return {
      baseUrl: this.fallbackBaseUrl,
      authHeader: this.fallbackAuthHeader,
      projectKey: this.fallbackProjectKey,
    };
  }

  async getMyIssues(): Promise<JiraIssue[]> {
    try {
      const config = await this.getConfig();
      const jql = `project = ${config.projectKey} AND assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`;

      const response = await axios.get(`${config.baseUrl}/rest/api/3/search/jql`, {
        headers: {
          Authorization: config.authHeader,
          Accept: 'application/json',
        },
        params: {
          jql,
          maxResults: 10,
          fields: 'summary,status,priority',
        },
      });

      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || 'None',
      }));
    } catch (error) {
      console.error('[Jira] Error:', error?.response?.status, error?.response?.data || error.message);
      return [];
    }
  }
}
