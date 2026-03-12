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
exports.GithubService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const settings_service_1 = require("../settings/settings.service");
const axios_1 = require("axios");
let GithubService = class GithubService {
    constructor(configService, settingsService) {
        this.configService = configService;
        this.settingsService = settingsService;
        this.apiBase = 'https://api.github.com';
        this.fallbackToken = this.configService.get('GITHUB_TOKEN') || '';
        this.fallbackOrg = this.configService.get('GITHUB_ORG') || '';
        this.fallbackRepo = this.configService.get('GITHUB_REPO') || '';
    }
    async getConfig() {
        const settings = await this.settingsService.getSettings();
        const gh = settings.github;
        return {
            token: gh.token || this.fallbackToken,
            org: gh.org || this.fallbackOrg,
            repo: gh.repo || this.fallbackRepo,
        };
    }
    headers(token) {
        return {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
        };
    }
    async getPullRequests() {
        try {
            const config = await this.getConfig();
            const response = await axios_1.default.get(`${this.apiBase}/repos/${config.org}/${config.repo}/pulls`, {
                headers: this.headers(config.token),
                params: { state: 'open', per_page: 10 },
            });
            return response.data.map((pr) => ({
                number: pr.number,
                title: pr.title,
                author: pr.user.login,
                created_at: pr.created_at,
                html_url: pr.html_url,
                draft: pr.draft,
            }));
        }
        catch (error) {
            return [];
        }
    }
    async getMyPullRequests() {
        try {
            const config = await this.getConfig();
            const userResponse = await axios_1.default.get(`${this.apiBase}/user`, {
                headers: this.headers(config.token),
            });
            const username = userResponse.data.login;
            const allPrs = await this.getPullRequests();
            return allPrs.filter((pr) => pr.author === username);
        }
        catch (error) {
            return [];
        }
    }
};
exports.GithubService = GithubService;
exports.GithubService = GithubService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        settings_service_1.SettingsService])
], GithubService);
//# sourceMappingURL=github.service.js.map