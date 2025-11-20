import { InjectRepository } from "@nestjs/typeorm";
import { PriceGroup } from "../entities/price-group.entity";
import { ConflictException, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreatePriceGroupDto } from "../dto/create-price-group.dto";



@Injectable()
export class PriceGroupService {
    constructor(
        @InjectRepository(PriceGroup)
        private readonly priceGroupRepository: Repository<PriceGroup>
    ){}
    

    async create(createPriceGroupDto: CreatePriceGroupDto) {
        const existing = await this.priceGroupRepository.findOne({
            where: { name: createPriceGroupDto.name }
        });
        
        if (existing) {
            throw new ConflictException('Ya existe un grupo de precios con ese nombre');
        }
        
        const priceGroup = this.priceGroupRepository.create(createPriceGroupDto);
        return await this.priceGroupRepository.save(priceGroup);
    }

    findAll() {
        return this.priceGroupRepository.find({
        });
    }
    
    
}
