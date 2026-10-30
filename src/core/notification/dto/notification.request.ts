import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '~/common/enums/notification-type.enum';

export class CreateNotificationDto {
    @IsString()
    title: string;
    @IsString()
    message: string;
    @IsEnum(NotificationType)
    type: NotificationType;
    @IsOptional()
    @IsString()
    recipientId?: string;
    @IsOptional()
    @IsString()
    orderId?: string;
}

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
