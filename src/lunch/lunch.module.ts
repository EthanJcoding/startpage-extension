import { Module } from '@nestjs/common';
import { LunchService } from './lunch.service';
import { LunchController } from './lunch.controller';

@Module({
  providers: [LunchService],
  controllers: [LunchController],
})
export class LunchModule {}
