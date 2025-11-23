// ... imports iguales al anterior
import { Controller, ParseFilePipeBuilder, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpStatus } from '@nestjs/common';
import { GenAIService, ImageAnalysisResponse } from './ai.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('AI')
@Controller('gen-ai')
export class GenAIController {
  constructor(private readonly genAIService: GenAIService) { }

  @Post('analyze') // Cambiamos el nombre del endpoint a algo más acorde
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        context: { type: 'string', description: 'Contexto adicional (opcional)' }, // <--- Nuevo campo
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async analyzeImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Body() body: { context?: string },
  ): Promise<ImageAnalysisResponse> {
    return await this.genAIService.analyzeImage(file, body.context);
  }
}