import { IsNotEmpty } from 'class-validator';

export class RefreshRequestDto {
  @IsNotEmpty({ message: 'The refresh token is required' })
  readonly refresh_token: string;
}
