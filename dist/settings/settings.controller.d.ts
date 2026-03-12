import { SettingsService, AppSettings } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<AppSettings>;
    updateSettings(body: Partial<AppSettings>): Promise<AppSettings>;
}
