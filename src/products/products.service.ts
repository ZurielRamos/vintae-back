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
      const { baseProductId, ...rest } = createProductDto;

      // 1. Obtener BaseProduct
      const baseProduct = await this.baseProductRepository.findOne({
        where: { id: baseProductId }
      });

      if (!baseProduct) {
        throw new NotFoundException('BaseProduct no encontrado');
      }

      // 2. Generar SKU automático: {baseProduct.sku}-{contador}
      const count = await this.productRepository.count({
        where: { baseProductId }
      });
      const productSKU = `${baseProduct.sku}-${String(count + 1).padStart(3, '0')}`;

      // 3. Crear producto
      const product = this.productRepository.create({
        ...rest,
        sku: productSKU,
        baseProductId: baseProduct.id
      } as DeepPartial<Product>);

      // 4. Generar embedding para búsqueda semántica
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
    queryBuilder.leftJoin('product.baseProduct', 'baseProduct');

    // --- 0.1 Select Base (siempre necesarios) ---
    const selectFields = [
      'product.id',
      'product.sku',
      'product.name',
      'product.imageUrls'
    ];

    // --- 0.2 Agregar campos condicionalmente según orderBy ---
    const allowedOrderFields = ['name', 'createdAt', 'updatedAt'];
    const safeOrderBy = allowedOrderFields.includes(orderBy) ? orderBy : 'name';

    // Agregar campo de ordenamiento si no está ya en el select
    if (safeOrderBy === 'createdAt' && !selectFields.includes('product.createdAt')) {
      selectFields.push('product.createdAt');
    }
    if (safeOrderBy === 'updatedAt' && !selectFields.includes('product.updatedAt')) {
      selectFields.push('product.updatedAt');
    }

    queryBuilder.select(selectFields);

    // --- 1. Filtros Dinámicos ---
    const toArray = (value: any) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    // Filtro BaseProducts (ManyToOne)
    if (baseProducts) {
      const ids = toArray(baseProducts);
      queryBuilder.andWhere('baseProduct.id IN (:...ids)', { ids });
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
      relations: ['baseProduct'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    const { baseProductId, ...rest } = updateProductDto as any;

    Object.assign(product, rest);

    if (baseProductId) {
      const baseProduct = await this.baseProductRepository.findOne({
        where: { id: baseProductId }
      });
      if (!baseProduct) {
        throw new NotFoundException('BaseProduct no encontrado');
      }
      product.baseProductId = baseProductId;
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
      relations: ['baseProduct'],
    });
  }

  /**
   * Obtener producto con información de compra de diseño del usuario
   */
  async findOneWithDesignPurchase(productId: number, userId?: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['baseProduct'],
    });


    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Si no hay usuario, retornar solo el producto
    if (!userId) {
      return {
        ...this.sanitizeProduct(product),
        designPurchase: null,
      };
    }

    // Buscar si el usuario ya compró este diseño
    const designPurchaseRepo = this.productRepository.manager.getRepository('DesignPurchase');
    const designPurchase = await designPurchaseRepo
      .createQueryBuilder('dp')
      .where('dp.userId = :userId', { userId })
      .andWhere('dp.productId = :productId', { productId })
      .getOne();

    return {
      ...this.sanitizeProduct(product),
      designPurchase: designPurchase
        ? {
          purchased: true,
          purchaseType: designPurchase.purchaseType, // 'ONE', 'FIVE', 'UNLIMITED'
          downloadsRemaining:
            designPurchase.downloadsRemaining === null
              ? 'unlimited'
              : designPurchase.downloadsRemaining,
          pricePaid: Number(designPurchase.pricePaid),
          purchasedAt: designPurchase.purchasedAt,
        }
        : {
          purchased: false,
          purchaseType: null,
          downloadsRemaining: 0,
          pricePaid: null,
          purchasedAt: null,
        },
    };
  }
}
