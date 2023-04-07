import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { getJWTTokenRegexp } from '../../refresh-token.regex';
import { RefreshTokenMessage } from '../../../enums/refresh-token-messages.ts/refresh-token-messages.enum';

export class RefreshRequestDto {
  @Matches(getJWTTokenRegexp(), { message: RefreshTokenMessage.INVALID })
  @IsString({ message: RefreshTokenMessage.STRING })
  @IsNotEmpty({ message: RefreshTokenMessage.REQUIRED })
  readonly refreshToken: string;
}
