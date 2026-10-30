import { PartialType } from '@nestjs/mapped-types';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerProfileRequest {
  @IsEmail({}, { message: 'Email tidak valid' })
  email: string;

  @IsString()
  @Matches(/^[A-Za-z\s]+$/, {
    message: 'Nama harus alfabet',
  })
  fullName: string;

  @IsString()
  @IsPhoneNumber('ID', { message: 'Nomor HP tidak valid' })
  @MaxLength(15)
  phoneNumber: string;
}

export class UpdateUserRequest extends PartialType(
  CreateCustomerProfileRequest,
) {}
