import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsNotEmpty({ message: 'A name is required' })
  name: string;

  @IsNotEmpty({ message: 'A password is required' })
  @MinLength(6, { message: 'Your password must be at least 6 characters' })
  password: string;

  @IsNotEmpty({ message: 'An email is required' })
  @MinLength(6, { message: 'Your name must be at least 6 characters' })
  email: string;

  @IsBoolean({ message: 'Acceptance of terms is required' })
  @Transform(({ value }) => value === 'true')
  acceptTerms: boolean;
}
