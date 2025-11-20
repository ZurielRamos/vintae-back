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
	) {}

	async create(dto: CreateBaseProductDto): Promise<BaseProduct> {
		const { categoryIds, primaryCategoryId, ...baseData } = dto;

		const baseProduct = this.baseProductRepository.create(baseData);
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

	async update(id: string, dto: UpdateBaseProductDto): Promise<BaseProduct> {
		const baseProduct = await this.baseProductRepository.findOne({ where: { id } });
		if (!baseProduct) {
			throw new NotFoundException(`BaseProduct with id ${id} not found`);
		}

		const { categoryIds, primaryCategoryId, ...baseData } = dto;
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
