import { Controller, Post, Body, Get, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/category.dto';
import { Category } from './entities/category.entity';
import { CategoryService } from './categories.service';

@ApiTags('Categorias Productos')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  // =================================================================
  // 1. GESTIÓN DE CATEGORÍAS (CRUD BÁSICO)
  // =================================================================

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crea una nueva categoría y establece su jerarquía (Closure Table).' })
  @ApiResponse({ status: 201, description: 'Categoría creada con éxito.', type: Category })
  @ApiResponse({ status: 400, description: 'Datos inválidos o error en la jerarquía.' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    // El servicio se encarga de crear el nodo y propagar las entradas en CategoryClosure
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene todas las categorías.' })
  @ApiResponse({ status: 200, description: 'Lista de categorías.', type: [Category] })
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get('principles')
  @ApiOperation({ summary: 'Obtiene todas las categorías.' })
  @ApiResponse({ status: 200, description: 'Lista de categorías.', type: [Category] })
  async getPrinciples(): Promise<Category[]> {
    return this.categoryService.getPrinciples();
  }

  @Get('tree')
  findAllNested() {
    return this.categoryService.findAllNested();
  }

  // =================================================================
  // 2. CONSULTAS JERÁRQUICAS (Optimizado con Closure Table)
  // =================================================================

  @Get(':id/descendants')
  @ApiOperation({ summary: 'Obtiene todas las subcategorías (de cualquier nivel) de la categoría dada.' })
  @ApiParam({ name: 'id', description: 'ID de la categoría raíz a consultar' })
  @ApiResponse({ status: 200, description: 'Lista de categorías descendientes.', type: [Category] })
  async findDescendants(@Param('id') id: string): Promise<Category[]> {
    return this.categoryService.findDescendants(id);
  }

  @Get(':id/descendants-ids')
  @ApiOperation({ summary: 'Obtiene todos los IDs de las subcategorías (de cualquier nivel) de la categoría dada.' })
  @ApiParam({ name: 'id', description: 'ID de la categoría raíz a consultar' })
  @ApiResponse({ status: 200, description: 'Lista de IDs de categorías descendientes.', type: [String] })
  async findDescendantsIds(@Param('id') id: string): Promise<String[]> {
    return this.categoryService.getCategoryAndDescendantIds(id);
  }

  @Get(':id/ancestors')
  @ApiOperation({ summary: 'Obtiene todos los padres y ancestros de la categoría (hasta la raíz).' })
  @ApiParam({ name: 'id', description: 'ID de la categoría hija a consultar' })
  @ApiResponse({ status: 200, description: 'Lista de categorías ancestras.', type: [Category] })
  async findAncestors(@Param('id') id: string): Promise<Category[]> {
    return this.categoryService.findAncestors(id);
  }

  @Get(':id/tree-full')
  async getCategoryTreeWithAncestors(@Param('id') id: string): Promise<{ ancestorsTree: Category | null; tree: Category | null }> {
    return this.categoryService.getCategoryTreeWithAncestors(id);
  }

}