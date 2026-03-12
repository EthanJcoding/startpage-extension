import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService, AppSettings } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getMaskedSettings();
  }

  @Put()
  updateSettings(@Body() body: Partial<AppSettings>) {
    return this.settingsService.updateSettings(body);
  }
}
