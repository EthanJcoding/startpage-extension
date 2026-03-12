import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
export interface JiraIssue {
    key: string;
    summary: string;
    status: string;
    priority: string;
}
export declare class JiraService {
    private configService;
    private settingsService;
    private readonly fallbackBaseUrl;
    private readonly fallbackAuthHeader;
    private readonly fallbackProjectKey;
    constructor(configService: ConfigService, settingsService: SettingsService);
    private getConfig;
    getMyIssues(): Promise<JiraIssue[]>;
}
