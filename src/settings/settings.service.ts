import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

export interface AppSettings {
  jira: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  github: {
    token: string;
    org: string;
    repo: string;
  };
}

@Injectable()
export class SettingsService {
  private readonly filePath: string;

  constructor(private configService: ConfigService) {
    const dataDir =
      this.configService.get<string>('DATA_DIR') ||
      '/Users/ethanjeong/Documents/Obsidian Vault/002-TODOS';
    this.filePath = join(dataDir, 'settings.json');
  }

  async getSettings(): Promise<AppSettings> {
    if (existsSync(this.filePath)) {
      const content = await readFile(this.filePath, 'utf-8');
      try {
        return JSON.parse(content);
      } catch {
        // fall through to defaults
      }
    }
    return this.getDefaultSettings();
  }

  async getMaskedSettings(): Promise<AppSettings> {
    const settings = await this.getSettings();
    return {
      jira: {
        baseUrl: settings.jira.baseUrl,
        email: settings.jira.email,
        apiToken: this.mask(settings.jira.apiToken),
        projectKey: settings.jira.projectKey,
      },
      github: {
        token: this.mask(settings.github.token),
        org: settings.github.org,
        repo: settings.github.repo,
      },
    };
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    if (partial.jira) {
      if (partial.jira.baseUrl !== undefined) current.jira.baseUrl = partial.jira.baseUrl;
      if (partial.jira.email !== undefined) current.jira.email = partial.jira.email;
      if (partial.jira.apiToken && !partial.jira.apiToken.includes('••••'))
        current.jira.apiToken = partial.jira.apiToken;
      if (partial.jira.projectKey !== undefined) current.jira.projectKey = partial.jira.projectKey;
    }
    if (partial.github) {
      if (partial.github.token && !partial.github.token.includes('••••'))
        current.github.token = partial.github.token;
      if (partial.github.org !== undefined) current.github.org = partial.github.org;
      if (partial.github.repo !== undefined) current.github.repo = partial.github.repo;
    }
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(current, null, 2), 'utf-8');
    return current;
  }

  private getDefaultSettings(): AppSettings {
    return {
      jira: {
        baseUrl: this.configService.get<string>('JIRA_BASE_URL') || '',
        email: this.configService.get<string>('JIRA_EMAIL') || '',
        apiToken: this.configService.get<string>('JIRA_API_TOKEN') || '',
        projectKey: this.configService.get<string>('JIRA_PROJECT_KEY') || '',
      },
      github: {
        token: this.configService.get<string>('GITHUB_TOKEN') || '',
        org: this.configService.get<string>('GITHUB_ORG') || '',
        repo: this.configService.get<string>('GITHUB_REPO') || '',
      },
    };
  }

  private mask(value: string): string {
    if (!value || value.length < 8) return value ? '••••' : '';
    return value.slice(0, 4) + '••••' + value.slice(-4);
  }
}
