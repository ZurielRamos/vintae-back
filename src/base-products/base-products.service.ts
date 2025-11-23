import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseProduct } from './entities/base-products.entity';
import { ProductCategory } from 'src/categories/entities/product-category.entity';
import { CreateBaseProductDto } from './dto/create-base-product.dto';
import { UpdateBaseProductDto } from './dto/update-base-product.dto';

@Injectable()
export class BaseProductsService {

	constructor(
		@InjectRepository(BaseProduct)
		private readonly baseProductRepository: Repository<BaseProduct>,
		@InjectRepository(ProductCategory)
		private readonly productCategoryRepository: Repository<ProductCategory>,
	) { }

	async create(dto: CreateBaseProductDto): Promise<BaseProduct> {
		const { categoryIds, primaryCategoryId, ...baseData } = dto;

		// Generar SKU único
		const sku = await this.generateSku();

		// Generar UUIDs para variantes que no tengan ID
		const variantsWithIds = baseData.variants?.map(variant => ({
			...variant,
			id: variant.id || this.generateUuid(),
		})) || [];

		const baseProduct = this.baseProductRepository.create({
			...baseData,
			variants: variantsWithIds,
			sku,
		});
		const savedProduct = await this.baseProductRepository.save(baseProduct);

		if (categoryIds && categoryIds.length > 0) {
			const productCategories = categoryIds.map((categoryId) =>
				this.productCategoryRepository.create({
					baseProductId: savedProduct.id,
					categoryId,
					isPrimary: primaryCategoryId === categoryId,
				}),
			);

			await this.productCategoryRepository.save(productCategories);
		}

		return this.baseProductRepository.findOne({
			where: { id: savedProduct.id },
			relations: ['productCategories', 'productCategories.category'],
		}) as Promise<BaseProduct>;
	}

	/**
	 * Genera un SKU único de 4 letras mayúsculas
	 */
	private async generateSku(): Promise<string> {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		let sku = '';
		let isUnique = false;
		let attempts = 0;

		while (!isUnique && attempts < 10) {
			sku = '';
			for (let i = 0; i < 4; i++) {
				sku += chars.charAt(Math.floor(Math.random() * chars.length));
			}

			const existing = await this.baseProductRepository.findOne({ where: { sku } });
			if (!existing) {
				isUnique = true;
			}
			attempts++;
		}

		if (!isUnique) {
			throw new Error('No se pudo generar un SKU único después de varios intentos');
		}

		return sku;
	}

	/**
	 * Genera un UUID v4 para las variantes
	 */
	private generateUuid(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	async update(id: string, dto: UpdateBaseProductDto): Promise<BaseProduct> {
		const baseProduct = await this.baseProductRepository.findOne({ where: { id } });
		if (!baseProduct) {
			throw new NotFoundException(`BaseProduct with id ${id} not found`);
		}

		const { categoryIds, primaryCategoryId, ...baseData } = dto;

		// Si se están actualizando variantes, asegurar que tengan IDs
		if (baseData.variants) {
			baseData.variants = baseData.variants.map(variant => ({
				...variant,
				id: variant.id || this.generateUuid(),
			}));
		}

		Object.assign(baseProduct, baseData);
		const savedProduct = await this.baseProductRepository.save(baseProduct);

		if (categoryIds) {
			await this.productCategoryRepository.delete({ baseProductId: id });

			if (categoryIds.length > 0) {
				const productCategories = categoryIds.map((categoryId) =>
					this.productCategoryRepository.create({
						baseProductId: id,
						categoryId,
						isPrimary: primaryCategoryId === categoryId,
					}),
				);

				await this.productCategoryRepository.save(productCategories);
			}
		} else if (primaryCategoryId) {
			const current = await this.productCategoryRepository.find({
				where: { baseProductId: id },
			});

			current.forEach((pc) => {
				pc.isPrimary = pc.categoryId === primaryCategoryId;
			});

			await this.productCategoryRepository.save(current);
		}

		return this.baseProductRepository.findOne({
			where: { id: savedProduct.id },
			relations: ['productCategories', 'productCategories.category'],
		}) as Promise<BaseProduct>;
	}

	async findAll(): Promise<BaseProduct[]> {
		return this.baseProductRepository.find({
			relations: ['productCategories', 'productCategories.category'],
			select: {
				id: true,
				name: true,
				sku: true,
				productCategories: {
					id: true,
					category: {
						id: true,
						name: true,
					},
				},
			},
		});
	}
}
