import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean, IsDate } from "class-validator";


export class CreateUserDto {

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MinLength(3)
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    // Campos opcionales para verificación de email
    @IsOptional()
    @IsBoolean()
    emailVerified?: boolean;

    @IsOptional()
    @IsString()
    verificationCode?: string;

    @IsOptional()
    @IsDate()
    verificationCodeExpiry?: Date;
}
