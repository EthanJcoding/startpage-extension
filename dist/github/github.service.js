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
const axios_1 = require("axios");
let GithubService = class GithubService {
    constructor(configService) {
        this.configService = configService;
        this.apiBase = 'https://api.github.com';
        this.token = this.configService.get('GITHUB_TOKEN') || '';
        this.org = this.configService.get('GITHUB_ORG') || '';
        this.repo = this.configService.get('GITHUB_REPO') || '';
    }
    get headers() {
        return {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github+json',
        };
    }
    async getPullRequests() {
        try {
            const response = await axios_1.default.get(`${this.apiBase}/repos/${this.org}/${this.repo}/pulls`, {
                headers: this.headers,
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
            const userResponse = await axios_1.default.get(`${this.apiBase}/user`, {
                headers: this.headers,
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
    __metadata("design:paramtypes", [config_1.ConfigService])
], GithubService);
//# sourceMappingURL=github.service.js.map