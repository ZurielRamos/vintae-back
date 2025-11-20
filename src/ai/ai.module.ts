import { Module } from '@nestjs/common';
import { GenAIController } from './ai.controller';
import { GenAIService } from './ai.service';

@Module({
  controllers: [GenAIController],
  providers: [GenAIService],
})
export class AiModule {}
