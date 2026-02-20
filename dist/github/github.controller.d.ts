import { GithubService } from './github.service';
export declare class GithubController {
    private readonly githubService;
    constructor(githubService: GithubService);
    getPullRequests(): Promise<import("./github.service").PullRequest[]>;
    getMyPullRequests(): Promise<import("./github.service").PullRequest[]>;
}
