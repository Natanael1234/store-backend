import { Transform } from 'class-transformer';
import { Equals } from 'class-validator';
import { CreateUserRequestDto } from '../../../../user/dtos/create-user/create-user.request.dto';

export class RegisterRequestDto extends CreateUserRequestDto {
  @Equals(true, { message: 'Acceptance of terms is required' })
  @Transform(({ value }) => {
    if (typeof value == 'string') {
      return value.toLowerCase() === 'true';
    } else if (value === true) {
      return true;
    }
    return false;
  })
  acceptTerms: boolean;
}
