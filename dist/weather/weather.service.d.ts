import { ConfigService } from '@nestjs/config';
export interface WeatherData {
    city: string;
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
}
export declare class WeatherService {
    private configService;
    private readonly apiKey;
    constructor(configService: ConfigService);
    getWeatherByCoords(lat: number, lon: number): Promise<WeatherData>;
}
