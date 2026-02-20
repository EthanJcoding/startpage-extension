import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import axios from 'axios';

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페'];

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

@Injectable()
export class LunchService {
  private readonly apiKey: string;
  private readonly reviewFilePath: string;
  private readonly hiddenFilePath: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KAKAO_REST_API_KEY') || '';
    const vaultPath =
      this.configService.get<string>('OBSIDIAN_VAULT_PATH') || '';
    this.reviewFilePath = join(vaultPath, 'lunch-reviews.md');
    this.hiddenFilePath = join(vaultPath, 'lunch-hidden.md');
  }

  async recommend(
    category?: string,
    page = 1,
  ): Promise<LunchRecommendation & { is_end: boolean }> {
    const selected =
      category && CATEGORIES.includes(category) ? category : CATEGORIES[0];

    const response = await axios.get(
      'https://dapi.kakao.com/v2/local/search/keyword.json',
      {
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
      },
    );

    const restaurants: Restaurant[] = (response.data.documents || []).map(
      (doc: any) => ({
        name: doc.place_name,
        category: doc.category_name,
        address: doc.road_address_name || doc.address_name,
        distance: doc.distance,
        place_url: doc.place_url,
        phone: doc.phone,
      }),
    );

    const is_end = response.data.meta?.is_end ?? true;
    return { category: selected, restaurants, is_end };
  }

  private async ensureReviewFile(): Promise<void> {
    if (!existsSync(this.reviewFilePath)) {
      const dir = dirname(this.reviewFilePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.reviewFilePath, '# Lunch Reviews\n', 'utf-8');
    }
  }

  async getReviews(): Promise<LunchReview[]> {
    await this.ensureReviewFile();
    const content = await readFile(this.reviewFilePath, 'utf-8');
    return this.parseReviews(content);
  }

  private parseReviews(content: string): LunchReview[] {
    const reviews: LunchReview[] = [];
    const entries = content.split(/^## /m).slice(1);

    for (const entry of entries) {
      const lines = entry.trim().split('\n');
      const name = lines[0].trim();
      let date = '',
        category = '',
        rating = 0,
        review = '';

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

      if (name) reviews.push({ name, category, rating, review, date });
    }

    return reviews;
  }

  async saveReview(data: {
    name: string;
    category: string;
    rating: number;
    review: string;
  }): Promise<LunchReview[]> {
    const reviews = await this.getReviews();
    const today = new Date().toISOString().slice(0, 10);
    const entry: LunchReview = { ...data, date: today };

    const idx = reviews.findIndex((r) => r.name === data.name);
    if (idx !== -1) reviews[idx] = entry;
    else reviews.unshift(entry);

    await this.serializeReviews(reviews);
    return reviews;
  }

  private async serializeReviews(reviews: LunchReview[]): Promise<void> {
    let content = '# Lunch Reviews\n\n';
    for (const r of reviews) {
      content += `## ${r.name}\n- 날짜: ${r.date}\n- 카테고리: ${r.category}\n- 평점: ${r.rating}\n- 리뷰: ${r.review}\n\n`;
    }
    await writeFile(this.reviewFilePath, content, 'utf-8');
  }

  // Hidden restaurants

  private async ensureHiddenFile(): Promise<void> {
    if (!existsSync(this.hiddenFilePath)) {
      const dir = dirname(this.hiddenFilePath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(this.hiddenFilePath, '# Hidden Restaurants\n', 'utf-8');
    }
  }

  async getHidden(): Promise<string[]> {
    await this.ensureHiddenFile();
    const content = await readFile(this.hiddenFilePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim().startsWith('- '))
      .map((line) => line.trim().substring(2));
  }

  async addHidden(name: string): Promise<string[]> {
    const hidden = await this.getHidden();
    if (!hidden.includes(name)) {
      hidden.push(name);
      await this.serializeHidden(hidden);
    }
    return hidden;
  }

  async removeHidden(name: string): Promise<string[]> {
    const hidden = (await this.getHidden()).filter((n) => n !== name);
    await this.serializeHidden(hidden);
    return hidden;
  }

  private async serializeHidden(names: string[]): Promise<void> {
    let content = '# Hidden Restaurants\n\n';
    for (const name of names) content += `- ${name}\n`;
    await writeFile(this.hiddenFilePath, content, 'utf-8');
  }
}
