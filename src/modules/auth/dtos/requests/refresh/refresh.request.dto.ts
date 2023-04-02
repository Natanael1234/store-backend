import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { getJWTTokenRegexp } from '../../refresh-token.regex';

export class RefreshRequestDto {
  @Matches(getJWTTokenRegexp(), { message: 'Invalid refresh token' })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  readonly refreshToken: string;
}
