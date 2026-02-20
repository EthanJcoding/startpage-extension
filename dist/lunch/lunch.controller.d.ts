import { LunchService } from './lunch.service';
export declare class LunchController {
    private readonly lunchService;
    constructor(lunchService: LunchService);
    recommend(category?: string, page?: string): Promise<import("./lunch.service").LunchRecommendation & {
        is_end: boolean;
    }>;
    getReviews(): Promise<import("./lunch.service").LunchReview[]>;
    saveReview(body: {
        name: string;
        category: string;
        rating: number;
        review: string;
    }): Promise<import("./lunch.service").LunchReview[]>;
    getHidden(): Promise<string[]>;
    addHidden(body: {
        name: string;
    }): Promise<string[]>;
    removeHidden(body: {
        name: string;
    }): Promise<string[]>;
}
