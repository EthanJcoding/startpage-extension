import { JiraService } from './jira.service';
export declare class JiraController {
    private readonly jiraService;
    constructor(jiraService: JiraService);
    getMyIssues(): Promise<import("./jira.service").JiraIssue[]>;
}
