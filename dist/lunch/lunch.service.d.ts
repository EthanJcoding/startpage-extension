import { ConfigService } from '@nestjs/config';
export interface Restaurant {
    name: string;
    category: string;
    address: string;
    distance: string;
    place_url: string;
    phone: string;
}
export interface LunchRecommendation {
    category: string;
    restaurants: Restaurant[];
}
export interface LunchReview {
    name: string;
    category: string;
    rating: number;
    review: string;
    date: string;
}
export declare class LunchService {
    private configService;
    private readonly apiKey;
    private readonly reviewFilePath;
    private readonly hiddenFilePath;
    constructor(configService: ConfigService);
    recommend(category?: string, page?: number): Promise<LunchRecommendation & {
        is_end: boolean;
    }>;
    private ensureReviewFile;
    getReviews(): Promise<LunchReview[]>;
    private parseReviews;
    saveReview(data: {
        name: string;
        category: string;
        rating: number;
        review: string;
    }): Promise<LunchReview[]>;
    private serializeReviews;
    private ensureHiddenFile;
    getHidden(): Promise<string[]>;
    addHidden(name: string): Promise<string[]>;
    removeHidden(name: string): Promise<string[]>;
    private serializeHidden;
}
