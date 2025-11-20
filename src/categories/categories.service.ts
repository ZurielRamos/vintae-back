import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, LinkBaseProductCategoryDto } from './dto/category.dto';
import { CategoryClosure } from './entities/category-clousure.entity';
import { ProductCategory } from './entities/product-category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(CategoryClosure)
    private closureRepository: Repository<CategoryClosure>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
    private dataSource: DataSource, // Para gestionar transacciones complejas
  ) {}

  // =================================================================
  // GESTIÓN DE CATEGORÍAS (CRUD con Closure Table)
  // =================================================================

  /**
   * Crea una nueva categoría y propaga las relaciones en la Closure Table dentro de una transacción.
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Crear el nodo Category
      const newCategory = this.categoryRepository.create(dto);
      const savedCategory = await queryRunner.manager.save(newCategory);
      const categoryId = savedCategory.id;

      // 2. Generar entradas en Closure Table
      
      // A. Relación consigo misma (Depth 0):
      await queryRunner.manager.save(this.closureRepository.create({ 
        ancestorId: categoryId, 
        descendantId: categoryId,
        depth: 0,
      }));
      
      // B. Relaciones con ancestros (Si tiene padre):
      if (dto.parentId) {
        // 🚨 SOLUCIÓN FINAL: Usamos nombres de columna en minúsculas (Postgres default)
        // y nos aseguramos de que el SELECT traiga el ID correcto.
        await queryRunner.manager.query(
            `
            INSERT INTO category_closures (ancestor_id, descendant_id, depth)
            SELECT ancestor_id, $1, depth + 1
            FROM category_closures
            WHERE descendant_id = $2;
            `,
            [categoryId, dto.parentId], 
        );
      }

      await queryRunner.commitTransaction();
      return savedCategory;
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Es crucial registrar el error para ver si la consulta falló por otra razón
      console.error('Error durante la creación de la categoría:', error); 
      throw new InternalServerErrorException('Failed to create category and establish hierarchy.');
    } finally {
      await queryRunner.release();
    }
  }


  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async getPrinciples(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parentId: IsNull() },
    });
  } 

  async findAllNested(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      order: { name: 'ASC' },
    });

    const categoryMap = new Map<string, Category>();
    categories.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
    });

    const roots: Category[] = [];

    categories.forEach(category => {
      const mappedCategory = categoryMap.get(category.id);
      if (!mappedCategory) {
        return;
      }

      if (mappedCategory.parentId) {
        const parent = categoryMap.get(mappedCategory.parentId);
        if (parent) {
          parent.children.push(mappedCategory);
        }
      } else {
        roots.push(mappedCategory);
      }
    });

    return roots;
  }

  
  // ... (Otros métodos CRUD básicos: findOne, update, delete)

  // =================================================================
  // CONSULTAS JERÁRQUICAS OPTIMIZADAS (Closure Table)
  // =================================================================

  /**
   * Obtiene todos los descendientes de una categoría (subcategorías de cualquier nivel)
   * Usa Query Builder en ambos pasos para asegurar la consistencia del mapeo de columnas.
   */
  async findDescendants(categoryId: string): Promise<Category[]> {
    
    // 1. Encontrar todos los IDs descendientes desde la Closure Table
    const descendantLinks = await this.closureRepository.createQueryBuilder('closure')
      
      // Selecciona el ID de la columna real en snake_case
      .select('closure.descendant_id', 'descendantId') 
      
      // Filtra por el ancestro usando el nombre de columna real en snake_case
      .where('closure.ancestor_id = :id', { id: categoryId }) 
      
      .getRawMany(); 

    if (descendantLinks.length === 0) {
      return [];
    }
    
    // 2. Extraer los IDs únicos (la propiedad es 'descendantId' por el alias que dimos)
    const descendantIds = descendantLinks.map(link => link.descendantId);

    // 3. 🚨 CORRECCIÓN FINAL: Usar Query Builder para buscar las categorías por ID.
    // Esto es más robusto que find({ where: { id: In(...) } })
    return this.categoryRepository.createQueryBuilder('category')
      .whereInIds(descendantIds) // Usa el array de IDs directamente
      .orderBy('category.name', 'ASC')
      .getMany();
  }


  /**
   * Obtiene el ID de la categoría inicial y todos los IDs de sus categorías descendientes.
   * @param categoryId El ID de la categoría padre a consultar.
   * @returns Una promesa que resuelve a un array de strings (UUIDs).
   */
  async getCategoryAndDescendantIds(categoryId: string): Promise<string[]> {
    // 1. Encontrar todos los IDs descendientes (incluyendo el ancestro con profundidad 0)
    const descendantLinks = await this.closureRepository.createQueryBuilder('closure')
        
        // Selecciona el ID de la columna real en snake_case
        .select('closure.descendant_id', 'descendantId') 
        
        // Filtra por el ancestro (profundidad 0 incluye al ancestro mismo)
        .where('closure.ancestor_id = :id', { id: categoryId }) 
        
        .getRawMany(); // getRawMany devuelve objetos con las claves definidas en .select()

    if (descendantLinks.length === 0) {
        // Esto solo debería pasar si la categoría inicial no existe en la Closure Table
        return [];
    }
    
    // 2. Extraer los IDs únicos y devolverlos
    // La lista ya incluye el ID del ancestro (ya que depth >= 0)
    return descendantLinks.map(link => link.descendantId);
  }



/**
   * Obtiene todos los ancestros de una categoría (Padre, Abuelo, etc.) de forma eficiente.
   */
  async findAncestors(categoryId: string): Promise<Category[]> {
    
    // 1. Encontrar todos los IDs Ancestros desde la Closure Table
    const ancestorLinks = await this.closureRepository.createQueryBuilder('closure')
      
      // 🚨 CAMBIO CLAVE: Seleccionamos el ID de la columna ANCESTOR.
      .select('closure.ancestor_id', 'ancestorId') 
      
      // 🚨 CAMBIO CLAVE: Filtramos por el ID de la columna DESCENDANT (el que estamos buscando).
      .where('closure.descendant_id = :id', { id: categoryId }) 
      
      // Excluimos la categoría misma (depth > 0)
      .andWhere('closure.depth > 0') 
      
      .getRawMany(); 

    if (ancestorLinks.length === 0) {
      return [];
    }
    
    // 2. Extraer los IDs únicos (la propiedad es 'ancestorId' por el alias que dimos)
    const ancestorIds = ancestorLinks.map(link => link.ancestorId);

    // 3. Buscar las entidades Category completas
    return this.categoryRepository.find({
      where: {
        id: In(ancestorIds), 
      },
      // Ordenamos por la profundidad para mantener el orden (Padre -> Abuelo).
      // Nota: Si quieres ordenar por profundidad, deberías hacerlo en el Query Builder.
      // Aquí, TypeORM solo ordena por el campo de la tabla Category (nombre).
      order: { name: 'ASC' } 
    });
  }
 
  async getCategoryTreeWithAncestors(categoryId: string): Promise<{ ancestorsTree: Category | null; tree: Category | null }> {
    const descendantIds = await this.getCategoryAndDescendantIds(categoryId);

    const descendants = await this.categoryRepository.find({
      where: {
        id: In(descendantIds),
      },
      order: { name: 'ASC' },
    });

    const descendantMap = new Map<string, Category>();
    descendants.forEach(category => {
      category.children = [];
      descendantMap.set(category.id, category);
    });

    descendants.forEach(category => {
      const mappedCategory = descendantMap.get(category.id);
      if (!mappedCategory) {
        return;
      }

      if (mappedCategory.parentId) {
        const parent = descendantMap.get(mappedCategory.parentId);
        if (parent) {
          parent.children.push(mappedCategory);
        }
      }
    });

    const tree = descendantMap.get(categoryId) || null;

    const ancestors = await this.findAncestors(categoryId);

    const ancestorMap = new Map<string, Category>();
    ancestors.forEach(category => {
      ancestorMap.set(category.id, { ...category, children: [] } as Category);
    });

    ancestors.forEach(category => {
      const node = ancestorMap.get(category.id);
      if (!node) {
        return;
      }

      if (category.parentId) {
        const parentNode = ancestorMap.get(category.parentId);
        if (parentNode) {
          (parentNode.children as Category[]).push(node);
        }
      }
    });

    let ancestorsTree: Category | null = null;
    ancestorMap.forEach(node => {
      if (!node.parentId || !ancestorMap.has(node.parentId)) {
        ancestorsTree = node;
      }
    });

    return { ancestorsTree, tree };
  }
 
}