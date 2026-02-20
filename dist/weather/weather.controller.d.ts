import { WeatherService } from './weather.service';
export declare class WeatherController {
    private readonly weatherService;
    constructor(weatherService: WeatherService);
    getWeather(lat: string, lon: string): Promise<import("./weather.service").WeatherData>;
}
