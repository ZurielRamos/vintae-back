import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PriceGroupService } from '../services/price-group.service';
import { CreatePriceGroupDto } from '../dto/create-price-group.dto';




@Controller('prices')
export class PricesController {
  constructor(
      private readonly priceGroupService: PriceGroupService
  ) {}

  @Post()
  createPriceGroup(@Body() createPriceGroupDto: CreatePriceGroupDto) {
    return this.priceGroupService.create(createPriceGroupDto);
  }

  @Get()
  findAllPriceGroups() {
    return this.priceGroupService.findAll();
  }


}
