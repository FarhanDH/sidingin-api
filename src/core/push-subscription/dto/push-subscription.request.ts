import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class SubscriptionKey {
    @IsString()
    p256dh: string;

    @IsString()
    auth: string;
}

export class CreatePushSubscriptionRequest {
    @IsString()
    endpoint: string;

    @IsNumber()
    @IsOptional()
    expirationTime?: number | null;

    @IsObject()
    @ValidateNested()
    @Type(() => SubscriptionKey)
    keys: SubscriptionKey;
}

export class UpdatePushSubscriptionRequest extends PartialType(
    CreatePushSubscriptionRequest,
) {}
