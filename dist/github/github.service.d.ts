import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
export interface PullRequest {
    number: number;
    title: string;
    author: string;
    created_at: string;
    html_url: string;
    draft: boolean;
}
export declare class GithubService {
    private configService;
    private settingsService;
    private readonly apiBase;
    private readonly fallbackToken;
    private readonly fallbackOrg;
    private readonly fallbackRepo;
    constructor(configService: ConfigService, settingsService: SettingsService);
    private getConfig;
    private headers;
    getPullRequests(): Promise<PullRequest[]>;
    getMyPullRequests(): Promise<PullRequest[]>;
}
