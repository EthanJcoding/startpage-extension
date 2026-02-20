import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { LunchService } from './lunch.service';

@Controller('lunch')
export class LunchController {
  constructor(private readonly lunchService: LunchService) {}

  @Get('recommend')
  async recommend(
    @Query('category') category?: string,
    @Query('page') page?: string,
  ) {
    try {
      return await this.lunchService.recommend(category, page ? parseInt(page) || 1 : 1);
    } catch (error) {
      throw new BadRequestException('Failed to fetch lunch recommendations');
    }
  }

  @Get('reviews')
  async getReviews() {
    return this.lunchService.getReviews();
  }

  @Post('review')
  async saveReview(
    @Body() body: { name: string; category: string; rating: number; review: string },
  ) {
    return this.lunchService.saveReview(body);
  }

  @Get('hidden')
  async getHidden() {
    return this.lunchService.getHidden();
  }

  @Post('hidden')
  async addHidden(@Body() body: { name: string }) {
    return this.lunchService.addHidden(body.name);
  }

  @Delete('hidden')
  async removeHidden(@Body() body: { name: string }) {
    return this.lunchService.removeHidden(body.name);
  }
}
