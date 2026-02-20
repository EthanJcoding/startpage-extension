import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly token: string;
  private readonly org: string;
  private readonly repo: string;
  private readonly apiBase = 'https://api.github.com';

  constructor(private configService: ConfigService) {
    this.token = this.configService.get<string>('GITHUB_TOKEN') || '';
    this.org = this.configService.get<string>('GITHUB_ORG') || '';
    this.repo = this.configService.get<string>('GITHUB_REPO') || '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
    };
  }

  async getPullRequests(): Promise<PullRequest[]> {
    try {
      const response = await axios.get(
        `${this.apiBase}/repos/${this.org}/${this.repo}/pulls`,
        {
          headers: this.headers,
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
      const userResponse = await axios.get(`${this.apiBase}/user`, {
        headers: this.headers,
      });
      const username = userResponse.data.login;

      const allPrs = await this.getPullRequests();
      return allPrs.filter((pr) => pr.author === username);
    } catch (error) {
      return [];
    }
  }
}
