import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  priority: string;
}

@Injectable()
export class JiraService {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly projectKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('JIRA_BASE_URL') || '';
    const email = this.configService.get<string>('JIRA_EMAIL') || '';
    const token = this.configService.get<string>('JIRA_API_TOKEN') || '';
    this.authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
    this.projectKey = this.configService.get<string>('JIRA_PROJECT_KEY') || '';
  }

  async getMyIssues(): Promise<JiraIssue[]> {
    try {
      const jql = `project = ${this.projectKey} AND assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`;

      const response = await axios.get(`${this.baseUrl}/rest/api/3/search/jql`, {
        headers: {
          Authorization: this.authHeader,
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
