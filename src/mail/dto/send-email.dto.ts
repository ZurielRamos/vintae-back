import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';

export class SendEmailDto {
    @IsEmail({}, { each: true })
    to: string | string[];

    @IsString()
    subject: string;

    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    @IsOptional()
    html?: string;

    @IsArray()
    @IsOptional()
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: string | Buffer;
    }>;
}
