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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
let SettingsService = class SettingsService {
    constructor(configService) {
        this.configService = configService;
        const dataDir = this.configService.get('DATA_DIR') ||
            '/Users/ethanjeong/Documents/Obsidian Vault/002-TODOS';
        this.filePath = (0, path_1.join)(dataDir, 'settings.json');
    }
    async getSettings() {
        if ((0, fs_1.existsSync)(this.filePath)) {
            const content = await (0, promises_1.readFile)(this.filePath, 'utf-8');
            try {
                return JSON.parse(content);
            }
            catch {
            }
        }
        return this.getDefaultSettings();
    }
    async getMaskedSettings() {
        const settings = await this.getSettings();
        return {
            jira: {
                baseUrl: settings.jira.baseUrl,
                email: settings.jira.email,
                apiToken: this.mask(settings.jira.apiToken),
                projectKey: settings.jira.projectKey,
            },
            github: {
                token: this.mask(settings.github.token),
                org: settings.github.org,
                repo: settings.github.repo,
            },
        };
    }
    async updateSettings(partial) {
        const current = await this.getSettings();
        if (partial.jira) {
            if (partial.jira.baseUrl !== undefined)
                current.jira.baseUrl = partial.jira.baseUrl;
            if (partial.jira.email !== undefined)
                current.jira.email = partial.jira.email;
            if (partial.jira.apiToken && !partial.jira.apiToken.includes('••••'))
                current.jira.apiToken = partial.jira.apiToken;
            if (partial.jira.projectKey !== undefined)
                current.jira.projectKey = partial.jira.projectKey;
        }
        if (partial.github) {
            if (partial.github.token && !partial.github.token.includes('••••'))
                current.github.token = partial.github.token;
            if (partial.github.org !== undefined)
                current.github.org = partial.github.org;
            if (partial.github.repo !== undefined)
                current.github.repo = partial.github.repo;
        }
        const dir = (0, path_1.dirname)(this.filePath);
        if (!(0, fs_1.existsSync)(dir))
            await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)(this.filePath, JSON.stringify(current, null, 2), 'utf-8');
        return current;
    }
    getDefaultSettings() {
        return {
            jira: {
                baseUrl: this.configService.get('JIRA_BASE_URL') || '',
                email: this.configService.get('JIRA_EMAIL') || '',
                apiToken: this.configService.get('JIRA_API_TOKEN') || '',
                projectKey: this.configService.get('JIRA_PROJECT_KEY') || '',
            },
            github: {
                token: this.configService.get('GITHUB_TOKEN') || '',
                org: this.configService.get('GITHUB_ORG') || '',
                repo: this.configService.get('GITHUB_REPO') || '',
            },
        };
    }
    mask(value) {
        if (!value || value.length < 8)
            return value ? '••••' : '';
        return value.slice(0, 4) + '••••' + value.slice(-4);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map