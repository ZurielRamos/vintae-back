import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemCouponDto {
  @ApiProperty({ 
    example: 'RECARGA50', 
    description: 'El código del cupón a canjear' 
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}