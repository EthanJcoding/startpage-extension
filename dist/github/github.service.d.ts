import { ConfigService } from '@nestjs/config';
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
    private readonly token;
    private readonly org;
    private readonly repo;
    private readonly apiBase;
    constructor(configService: ConfigService);
    private get headers();
    getPullRequests(): Promise<PullRequest[]>;
    getMyPullRequests(): Promise<PullRequest[]>;
}
