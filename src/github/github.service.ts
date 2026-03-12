import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import axios from 'axios';

export interface PullRequest {
  number: number;
  title: string;
  author: string;
  created_at: string;
  html_url: string;
  draft: boolean;
}

@Injectable()
export class GithubService {
  private readonly apiBase = 'https://api.github.com';
  private readonly fallbackToken: string;
  private readonly fallbackOrg: string;
  private readonly fallbackRepo: string;

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {
    this.fallbackToken = this.configService.get<string>('GITHUB_TOKEN') || '';
    this.fallbackOrg = this.configService.get<string>('GITHUB_ORG') || '';
    this.fallbackRepo = this.configService.get<string>('GITHUB_REPO') || '';
  }

  private async getConfig() {
    const settings = await this.settingsService.getSettings();
    const gh = settings.github;
    return {
      token: gh.token || this.fallbackToken,
      org: gh.org || this.fallbackOrg,
      repo: gh.repo || this.fallbackRepo,
    };
  }

  private headers(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    };
  }

  async getPullRequests(): Promise<PullRequest[]> {
    try {
      const config = await this.getConfig();
      const response = await axios.get(
        `${this.apiBase}/repos/${config.org}/${config.repo}/pulls`,
        {
          headers: this.headers(config.token),
          params: { state: 'open', per_page: 10 },
        },
      );

      return response.data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        created_at: pr.created_at,
        html_url: pr.html_url,
        draft: pr.draft,
      }));
    } catch (error) {
      return [];
    }
  }

  async getMyPullRequests(): Promise<PullRequest[]> {
    try {
      const config = await this.getConfig();
      const userResponse = await axios.get(`${this.apiBase}/user`, {
        headers: this.headers(config.token),
      });
      const username = userResponse.data.login;

      const allPrs = await this.getPullRequests();
      return allPrs.filter((pr) => pr.author === username);
    } catch (error) {
      return [];
    }
  }
}
