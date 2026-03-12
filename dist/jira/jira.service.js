"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const settings_service_1 = require("../settings/settings.service");
const axios_1 = require("axios");
let JiraService = class JiraService {
    constructor(configService, settingsService) {
        this.configService = configService;
        this.settingsService = settingsService;
        this.fallbackBaseUrl = this.configService.get('JIRA_BASE_URL') || '';
        const email = this.configService.get('JIRA_EMAIL') || '';
        const token = this.configService.get('JIRA_API_TOKEN') || '';
        this.fallbackAuthHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;
        this.fallbackProjectKey = this.configService.get('JIRA_PROJECT_KEY') || '';
    }
    async getConfig() {
        const settings = await this.settingsService.getSettings();
        const jira = settings.jira;
        if (jira.baseUrl && jira.email && jira.apiToken) {
            return {
                baseUrl: jira.baseUrl,
                authHeader: `Basic ${Buffer.from(`${jira.email}:${jira.apiToken}`).toString('base64')}`,
                projectKey: jira.projectKey || this.fallbackProjectKey,
            };
        }
        return {
            baseUrl: this.fallbackBaseUrl,
            authHeader: this.fallbackAuthHeader,
            projectKey: this.fallbackProjectKey,
        };
    }
    async getMyIssues() {
        try {
            const config = await this.getConfig();
            const jql = `project = ${config.projectKey} AND assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`;
            const response = await axios_1.default.get(`${config.baseUrl}/rest/api/3/search/jql`, {
                headers: {
                    Authorization: config.authHeader,
                    Accept: 'application/json',
                },
                params: {
                    jql,
                    maxResults: 10,
                    fields: 'summary,status,priority',
                },
            });
            return response.data.issues.map((issue) => ({
                key: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                priority: issue.fields.priority?.name || 'None',
            }));
        }
        catch (error) {
            console.error('[Jira] Error:', error?.response?.status, error?.response?.data || error.message);
            return [];
        }
    }
};
exports.JiraService = JiraService;
exports.JiraService = JiraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        settings_service_1.SettingsService])
], JiraService);
//# sourceMappingURL=jira.service.js.map