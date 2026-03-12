import { ConfigService } from '@nestjs/config';
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
export declare class SettingsService {
    private configService;
    private readonly filePath;
    constructor(configService: ConfigService);
    getSettings(): Promise<AppSettings>;
    getMaskedSettings(): Promise<AppSettings>;
    updateSettings(partial: Partial<AppSettings>): Promise<AppSettings>;
    private getDefaultSettings;
    private mask;
}
