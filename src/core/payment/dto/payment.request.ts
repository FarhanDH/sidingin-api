import { IsEnum, IsNotEmpty } from 'class-validator';

export enum SupportedPaymentMethod {
    QRIS = 'qris',
    BCA = 'bca',
    BNI = 'bni',
    BRI = 'bri',
    MANDIRI = 'mandiri',
    PERMATA = 'permata',
}

export class CreateCoreApiPaymentRequestDto {
    @IsEnum(SupportedPaymentMethod)
    @IsNotEmpty()
    paymentMethod: SupportedPaymentMethod;
}
