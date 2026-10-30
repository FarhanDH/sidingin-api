import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    MaxLength,
    IsNumber,
    IsPositive,
    IsArray,
    ValidateNested,
} from 'class-validator';

class CreateInvoiceItemDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    description: string;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}

/**
 * DTO for the request body when creating a new invoice.
 */
export class CreateInvoiceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {}
