import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class LoginResponseDto {
  // access_token: string;
  status: 'success';
  data: AuthenticationPayloadDto;
}
