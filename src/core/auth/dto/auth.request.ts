import { IsEmail, IsNumberString } from 'class-validator';

export class OtpRequest {
    @IsEmail({}, { message: 'Email tidak valid' })
    email: string;
}

export class VerifyOtpRequest {
    @IsEmail({}, { message: 'Email tidak valid' })
    email: string;

    @IsNumberString({}, { message: 'OTP salah atau sudah kedaluwarsa' })
    otp: string;
}
