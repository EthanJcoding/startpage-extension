import { ConfigService } from '@nestjs/config';
export interface JiraIssue {
    key: string;
    summary: string;
    status: string;
    priority: string;
}
export declare class JiraService {
    private configService;
    private readonly baseUrl;
    private readonly authHeader;
    private readonly projectKey;
    constructor(configService: ConfigService);
    getMyIssues(): Promise<JiraIssue[]>;
}
