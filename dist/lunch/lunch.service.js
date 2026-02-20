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
exports.LunchService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = require("path");
const axios_1 = require("axios");
const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페'];
let LunchService = class LunchService {
    constructor(configService) {
        this.configService = configService;
        this.apiKey = this.configService.get('KAKAO_REST_API_KEY') || '';
        const vaultPath = this.configService.get('OBSIDIAN_VAULT_PATH') || '';
        this.reviewFilePath = (0, path_1.join)(vaultPath, 'lunch-reviews.md');
        this.hiddenFilePath = (0, path_1.join)(vaultPath, 'lunch-hidden.md');
    }
    async recommend(category, page = 1) {
        const selected = category && CATEGORIES.includes(category) ? category : CATEGORIES[0];
        const response = await axios_1.default.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            headers: { Authorization: `KakaoAK ${this.apiKey}` },
            params: {
                query: `성수역 ${selected}`,
                x: '127.0560',
                y: '37.5446',
                radius: 1000,
                size: 15,
                page,
                sort: 'distance',
            },
        });
        const restaurants = (response.data.documents || []).map((doc) => ({
            name: doc.place_name,
            category: doc.category_name,
            address: doc.road_address_name || doc.address_name,
            distance: doc.distance,
            place_url: doc.place_url,
            phone: doc.phone,
        }));
        const is_end = response.data.meta?.is_end ?? true;
        return { category: selected, restaurants, is_end };
    }
    async ensureReviewFile() {
        if (!(0, fs_1.existsSync)(this.reviewFilePath)) {
            const dir = (0, path_1.dirname)(this.reviewFilePath);
            if (!(0, fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            await (0, promises_1.writeFile)(this.reviewFilePath, '# Lunch Reviews\n', 'utf-8');
        }
    }
    async getReviews() {
        await this.ensureReviewFile();
        const content = await (0, promises_1.readFile)(this.reviewFilePath, 'utf-8');
        return this.parseReviews(content);
    }
    parseReviews(content) {
        const reviews = [];
        const entries = content.split(/^## /m).slice(1);
        for (const entry of entries) {
            const lines = entry.trim().split('\n');
            const name = lines[0].trim();
            let date = '', category = '', rating = 0, review = '';
            for (const line of lines.slice(1)) {
                const t = line.trim();
                if (t.startsWith('- 날짜: '))
                    date = t.substring('- 날짜: '.length);
                else if (t.startsWith('- 카테고리: '))
                    category = t.substring('- 카테고리: '.length);
                else if (t.startsWith('- 평점: '))
                    rating = parseInt(t.substring('- 평점: '.length)) || 0;
                else if (t.startsWith('- 리뷰: '))
                    review = t.substring('- 리뷰: '.length);
            }
            if (name)
                reviews.push({ name, category, rating, review, date });
        }
        return reviews;
    }
    async saveReview(data) {
        const reviews = await this.getReviews();
        const today = new Date().toISOString().slice(0, 10);
        const entry = { ...data, date: today };
        const idx = reviews.findIndex((r) => r.name === data.name);
        if (idx !== -1)
            reviews[idx] = entry;
        else
            reviews.unshift(entry);
        await this.serializeReviews(reviews);
        return reviews;
    }
    async serializeReviews(reviews) {
        let content = '# Lunch Reviews\n\n';
        for (const r of reviews) {
            content += `## ${r.name}\n- 날짜: ${r.date}\n- 카테고리: ${r.category}\n- 평점: ${r.rating}\n- 리뷰: ${r.review}\n\n`;
        }
        await (0, promises_1.writeFile)(this.reviewFilePath, content, 'utf-8');
    }
    async ensureHiddenFile() {
        if (!(0, fs_1.existsSync)(this.hiddenFilePath)) {
            const dir = (0, path_1.dirname)(this.hiddenFilePath);
            if (!(0, fs_1.existsSync)(dir)) {
                await (0, promises_1.mkdir)(dir, { recursive: true });
            }
            await (0, promises_1.writeFile)(this.hiddenFilePath, '# Hidden Restaurants\n', 'utf-8');
        }
    }
    async getHidden() {
        await this.ensureHiddenFile();
        const content = await (0, promises_1.readFile)(this.hiddenFilePath, 'utf-8');
        return content
            .split('\n')
            .filter((line) => line.trim().startsWith('- '))
            .map((line) => line.trim().substring(2));
    }
    async addHidden(name) {
        const hidden = await this.getHidden();
        if (!hidden.includes(name)) {
            hidden.push(name);
            await this.serializeHidden(hidden);
        }
        return hidden;
    }
    async removeHidden(name) {
        const hidden = (await this.getHidden()).filter((n) => n !== name);
        await this.serializeHidden(hidden);
        return hidden;
    }
    async serializeHidden(names) {
        let content = '# Hidden Restaurants\n\n';
        for (const name of names)
            content += `- ${name}\n`;
        await (0, promises_1.writeFile)(this.hiddenFilePath, content, 'utf-8');
    }
};
exports.LunchService = LunchService;
exports.LunchService = LunchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LunchService);
//# sourceMappingURL=lunch.service.js.map