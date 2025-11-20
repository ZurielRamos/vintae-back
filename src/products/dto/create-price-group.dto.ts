import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePriceGroupDto {
    
    @ApiProperty({example: 'Camiseta Básica DTF'})
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({example: 30000})
    @IsNumber()
    @IsNotEmpty()
    basePrice: number;
}