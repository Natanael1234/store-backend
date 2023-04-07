import { Transform } from 'class-transformer';
import { Equals } from 'class-validator';
import { CreateUserRequestDTO } from '../../../../user/dtos/create-user/create-user.request.dto';
import { RefreshTokenMessage } from '../../../enums/refresh-token-messages.ts/refresh-token-messages.enum';

export class RegisterRequestDto extends CreateUserRequestDTO {
  name: string;
  @Equals(true, { message: RefreshTokenMessage.REQUIRED })
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
