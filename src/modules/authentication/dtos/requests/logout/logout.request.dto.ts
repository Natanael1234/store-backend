import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { RefreshTokenMessage } from '../../../enums/refresh-token-messages.ts/refresh-token-messages.enum';
import { getJWTTokenRegexp } from '../../refresh-token.regex';

export class LogoutRequestDto {
  /**
   * Refresh token.
   */
  @Matches(getJWTTokenRegexp(), { message: RefreshTokenMessage.INVALID })
  @IsString({ message: RefreshTokenMessage.STRING })
  @IsNotEmpty({ message: RefreshTokenMessage.REQUIRED })
  readonly refreshToken: string;
}
