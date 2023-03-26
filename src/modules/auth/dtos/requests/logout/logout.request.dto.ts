import { IsNotEmpty } from 'class-validator';

export class LogoutRequestDto {
  @IsNotEmpty({ message: 'A refresh token is required' })
  readonly refresh_token: string;
}
