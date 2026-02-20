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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LunchController = void 0;
const common_1 = require("@nestjs/common");
const lunch_service_1 = require("./lunch.service");
let LunchController = class LunchController {
    constructor(lunchService) {
        this.lunchService = lunchService;
    }
    async recommend(category, page) {
        try {
            return await this.lunchService.recommend(category, page ? parseInt(page) || 1 : 1);
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to fetch lunch recommendations');
        }
    }
    async getReviews() {
        return this.lunchService.getReviews();
    }
    async saveReview(body) {
        return this.lunchService.saveReview(body);
    }
    async getHidden() {
        return this.lunchService.getHidden();
    }
    async addHidden(body) {
        return this.lunchService.addHidden(body.name);
    }
    async removeHidden(body) {
        return this.lunchService.removeHidden(body.name);
    }
};
exports.LunchController = LunchController;
__decorate([
    (0, common_1.Get)('recommend'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "recommend", null);
__decorate([
    (0, common_1.Get)('reviews'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)('review'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "saveReview", null);
__decorate([
    (0, common_1.Get)('hidden'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "getHidden", null);
__decorate([
    (0, common_1.Post)('hidden'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "addHidden", null);
__decorate([
    (0, common_1.Delete)('hidden'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LunchController.prototype, "removeHidden", null);
exports.LunchController = LunchController = __decorate([
    (0, common_1.Controller)('lunch'),
    __metadata("design:paramtypes", [lunch_service_1.LunchService])
], LunchController);
//# sourceMappingURL=lunch.controller.js.map