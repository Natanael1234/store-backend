import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { getJWTTokenRegexp } from '../../refresh-token.regex';

export class LogoutRequestDto {
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  @Matches(getJWTTokenRegexp(), { message: 'Invalid refresh token' })
  readonly refreshToken: string;
}
