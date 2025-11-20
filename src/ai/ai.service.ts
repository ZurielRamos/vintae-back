import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai'; // La librería que pediste

export interface ImageAnalysisResponse {
  title: string;
  description: string;
  themes: string[];
  style: string;
  tags: string[];
  colors: string[]; // Ej: Códigos Hex o nombres de colores
}

@Injectable()
export class GenAIService {
  private client: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) throw new Error('GOOGLE_API_KEY is missing');

    // Inicialización específica de @google/genai
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyzeImage(imageFile: Express.Multer.File, context?: string): Promise<ImageAnalysisResponse> {
    // 1. Convertir imagen a Base64
    const base64Image = imageFile.buffer.toString('base64');

    // 1. PROMPT MEJORADO: Instrucciones explícitas de integración
    let promptText = `
      Analiza esta imagen y genera un JSON estricto.
      
    INSTRUCCIONES DE VELOCIDAD PARA 'description':
      - Sé EXTREMADAMENTE CONCISO.
      - Máximo 30 palabras (o 2 oraciones cortas).
      - Integra themes, colors y tags, pero ve directo al punto.
      - No uses retórica floral ni introducciones largas.
      
    `;

    if (context) {
      promptText += `\n\nCONTEXTO DEL USUARIO: "${context}". (Usa este contexto para enfocar el análisis).`;
    }

    // 2. Definir el esquema JSON manualmente (como objeto plano)
    const schema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'El titulo siempre debe comenzar con el nombre del producto "ej. camiseta, hoddie, mug, etc" y luego algo relativo a la tematica del diseño en el producto' },
        description: { type: 'STRING', description: 'Descripción detallada integrando de manera natural el "contexto del usuario", los themes, style, tags y colors en la descripción generada, resumen muy breve y denso (maximo 40 palabras)' },
        themes: { 
          type: 'ARRAY', 
          description: 'terminos relativos a la tematica del diseño en el producto (ej: musica, rap, peliculas, series, videojuegos, tecnologia, deportes, etc)',
          items: { type: 'STRING' } 
        },
        style: { 
          type: 'ARRAY', 
          description: 'Estilo visual del diseño en el producto, puede ser abstracto, realista, popart, minimalista, physodelico, etc',
          items: { type: 'STRING' } 
        },
        tags: { 
          type: 'ARRAY', 
          items: { type: 'STRING' } 
        },
        colors: { 
          type: 'ARRAY', 
          items: { type: 'STRING' },
          description: 'colores del diseño en el producto, no del producto como tal' 
        },
      },
      required: ['title', 'description', 'themes', 'style', 'tags', 'colors'],
    };

    try {
      // 3. Llamada usando la sintaxis de @google/genai
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: imageFile.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

// 1. Verificamos que haya candidatos
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('La IA no devolvió ningún candidato.');
      }

      // 2. Accedemos profundamente a la estructura de la respuesta
      // Estructura: response -> candidates[0] -> content -> parts[0] -> text
      const candidate = response.candidates[0];
      const firstPart = candidate.content?.parts?.[0];
      
      if (!firstPart || !firstPart.text) {
         throw new Error('El candidato no contiene texto.');
      }

      let jsonString = firstPart.text;

      // 3. Limpieza de seguridad (a veces la IA añade ```json ... ``` aunque le pidamos JSON puro)
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      // 4. Parseo
      return JSON.parse(jsonString) as ImageAnalysisResponse;

    } catch (error) {
      console.error('Error detallado en GenAI:', JSON.stringify(error, null, 2));
      throw new BadRequestException('No se pudo procesar la respuesta de la IA.');
    }
  }
}