import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class RefreshResponseDto {
  public status: 'success';
  public data: AuthenticationPayloadDto;
}
