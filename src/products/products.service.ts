import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { GoogleGenAI } from '@google/genai';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { BaseProduct } from 'src/base-products/entities/base-products.entity';
import { In, Repository, DeepPartial } from 'typeorm';

@Injectable()
export class ProductsService {

  private ai: GoogleGenAI;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BaseProduct)
    private readonly baseProductRepository: Repository<BaseProduct>,
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })
  }

  async create(createProductDto: CreateProductDto) {

    try {
      const { baseProductIds, ...rest } = createProductDto;

      const product = this.productRepository.create(rest as DeepPartial<Product>);

      if (baseProductIds && baseProductIds.length > 0) {
        const baseProducts = await this.baseProductRepository.find({
          where: { id: In(baseProductIds) },
        });
        if (baseProducts.length !== baseProductIds.length) {
          throw new NotFoundException('Uno o más "Productos Base" no encontrados en la base de datos');
        }
        product.baseProducts = baseProducts;
      }

      const embedding = await this.generateEmbedding(`
        Nombre: ${product.name}.
        Tags: ${product.tags.join(', ')}.
        Colores Disponibles: ${product.availableColors.join(', ')}.
        Colores del Diseño: ${product.designColors.join(', ')}.
      `);

      product.embedding = embedding;
      const savedProduct = await this.productRepository.save(product);
      return this.sanitizeProduct(savedProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }






async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 20,
      searchText,
      themes,          // CORREGIDO: Antes 'theme', ahora 'themes' (plural)
      styles,
      availableColors,
      designColors,
      tags,
      baseProducts,
      orderBy = 'name',
      orderDirection = 'ASC',
    } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // --- 0. Relaciones ---
    queryBuilder.leftJoinAndSelect('product.baseProducts', 'baseProducts');

    // --- 1. Filtros Dinámicos ---
    const toArray = (value: any) => {
        if (!value) return [];
        return Array.isArray(value) ? value : [value];
    };

    // Filtro BaseProducts (Many-to-Many)
    if (baseProducts) {
      const ids = toArray(baseProducts);
      queryBuilder.andWhere('baseProducts.id IN (:...ids)', { ids });
    }

    // Filtros Arrays (Postgres text[]) con Overlap (&&)
    
    // CORREGIDO: Filtro por 'themes'
    if (themes) {
      queryBuilder.andWhere('product.themes && (:themes)::text[]', { 
        themes: toArray(themes) 
      });
    }

    if (styles) {
      queryBuilder.andWhere('product.styles && (:styles)::text[]', { 
        styles: toArray(styles) 
      });
    }

    if (availableColors) {
      queryBuilder.andWhere('product.availableColors && (:colors)::text[]', { 
        colors: toArray(availableColors) 
      });
    }

    if (designColors) {
      queryBuilder.andWhere('product.designColors && (:dcolors)::text[]', { 
        dcolors: toArray(designColors) 
      });
    }

    if (tags) {
      queryBuilder.andWhere('product.tags && (:tags)::text[]', { 
        tags: toArray(tags) 
      });
    }

    // --- 2. Lógica de Ordenamiento y Optimización ---
    
    if (searchText) {
      // BÚSQUEDA SEMÁNTICA
      const searchEmbedding = await this.generateEmbedding(searchText);
      const embeddingString = `[${searchEmbedding.join(',')}]`;

      // NOTA IMPORTANTE:
      // Aunque 'select: false' está en la entidad, SQL todavía puede USAR la columna
      // para hacer cálculos matemáticos (como la distancia <=>) en el motor de BD.
      // Aquí pedimos que nos devuelva la 'distance', pero NO el 'product.embedding'.
      
      queryBuilder
        .addSelect('product.embedding <=> (:searchEmbedding)::vector', 'distance')
        .andWhere('product.embedding IS NOT NULL')
        .setParameter('searchEmbedding', embeddingString)
        .orderBy('distance', 'ASC'); 

    } else {
      // ORDENAMIENTO ESTÁNDAR
      const allowedOrderFields = ['name', 'createdAt', 'updatedAt', 'individualPrice'];
      const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'name';
      const safeOrderDirection = orderDirection === 'DESC' ? 'DESC' : 'ASC';

      queryBuilder.orderBy(`product.${safeOrderBy}`, safeOrderDirection);
    }

    // --- 3. Paginación ---
    queryBuilder.skip(skip).take(limit);

    const [items, totalResults] = await queryBuilder.getManyAndCount();

    // Ya no necesitamos borrar manualmente el embedding si pusimos select:false en la entidad
    // const data = items; 

    const totalPages = Math.ceil(totalResults / limit);
    
    return {
      data: items, // Retornamos items limpios (sin vector pesado)
      meta: {
        totalResults,
        resultsPerPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }








  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['baseProducts'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const { baseProductIds, ...rest } = updateProductDto as any;

    Object.assign(product, rest);

    if (baseProductIds) {
      if (baseProductIds.length > 0) {
        const baseProducts = await this.baseProductRepository.findBy({ id: In(baseProductIds) });
        product.baseProducts = baseProducts;
      } else {
        product.baseProducts = [];
      }
    }

    const tags = product.tags || [];
    const availableColors = product.availableColors || [];
    const designColors = product.designColors || [];

    const embedding = await this.generateEmbedding(`
      Nombre: ${product.name}. 
      Temas: ${product.themes.join(' ')}.
      Estilos: ${product.styles.join(' ')}.
      Tags: ${tags.join(' ')} 
      Colores Disponibles: ${availableColors.join(' ')}. 
      Colores del Diseño: ${designColors.join(' ')}.`);
    product.embedding = embedding;

    const savedProduct = await this.productRepository.save(product);
    return this.sanitizeProduct(savedProduct);
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await this.ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
      config: {
        taskType: 'SEMANTIC_SIMILARITY'
      }
    });
    const vector = res.embeddings?.[0]?.values;
    if (!vector) {
      throw new Error('Failed to generate embedding');
    }
    return vector as number[];
  }

  private sanitizeProduct(product: Product) {
    const { embedding, ...rest } = product;
    return rest;
  }


  async findOne(id: number) {
    return this.productRepository.findOne({
      where: { id },
      relations: ['baseProducts'],
    });
  } 

  private sanitizeProducts(products: Product[]) {
    return products.map((product) => this.sanitizeProduct(product));
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const length = Math.min(vectorA.length, vectorB.length);
    if (!length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      const a = vectorA[i];
      const b = vectorB[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (!normA || !normB) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
