import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class RegisterResponseDto {
  status: 'success';
  data: AuthenticationPayloadDto;
}
