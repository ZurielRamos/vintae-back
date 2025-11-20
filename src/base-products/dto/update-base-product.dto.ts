import { PartialType } from '@nestjs/mapped-types';
import { CreateBaseProductDto } from './create-base-product.dto';

export class UpdateBaseProductDto extends PartialType(CreateBaseProductDto) {}
