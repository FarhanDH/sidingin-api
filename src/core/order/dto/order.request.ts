import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsInt,
    IsLatitude,
    IsLongitude,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Matches,
    Max,
    ValidateNested,
} from 'class-validator';
import { ACBrandEnum } from '~/common/enums/ac-brand.enum';
import { ACCapacityEnum } from '~/common/enums/ac-capacity.enum';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';

class AcUnitDto {
    @IsString()
    @IsNotEmpty()
    acTypeId: string;

    @IsEnum(ACCapacityEnum)
    @IsNotEmpty()
    acCapacity: ACCapacityEnum;

    @IsEnum(ACBrandEnum)
    @IsNotEmpty()
    brand: ACBrandEnum;

    @IsInt()
    @IsPositive()
    @Max(10)
    quantity: number;
}

export class CancelOrderRequestDto {
    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsString()
    @IsOptional()
    note?: string;
}

export class ServiceLocationRequestDto {
    @IsLatitude()
    latitude: number;

    @IsLongitude()
    longitude: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    note?: string;
}

export class CreateOrderRequestDto {
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    acProblems: string[];

    @IsObject()
    @ValidateNested()
    @Type(() => ServiceLocationRequestDto)
    serviceLocation: ServiceLocationRequestDto;

    @IsString()
    @IsNotEmpty()
    propertyType: string;

    @IsInt()
    @IsPositive()
    @Max(20)
    floor: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AcUnitDto)
    acUnits: AcUnitDto[];

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Format tanggal service harus YYYY-MM-DD',
    })
    serviceDate: string;

    @IsString()
    @IsOptional()
    note?: string;
}

export class UpdateOrderStatusRequestDto {
    @IsEnum(OrderStatusEnum)
    @IsNotEmpty()
    status: OrderStatusEnum;

    @IsLatitude()
    @IsOptional()
    technicianLatitude?: number;

    @IsLongitude()
    @IsOptional()
    technicianLongitude?: number;
}

export class UpdateOrderRequestDto extends PartialType(CreateOrderRequestDto) {}
