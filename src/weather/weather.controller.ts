import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeather(@Query('lat') lat: string, @Query('lon') lon: string) {
    if (!lat || !lon) {
      throw new BadRequestException('lat and lon query parameters are required');
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      throw new BadRequestException('lat and lon must be valid numbers');
    }

    try {
      return await this.weatherService.getWeatherByCoords(latNum, lonNum);
    } catch (error) {
      throw new BadRequestException('Failed to fetch weather data');
    }
  }
}
