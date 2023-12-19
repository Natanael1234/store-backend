import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class LoginResponseDto {
  // access_token: string;

  /**
   * Status.
   *
   * @example 'success'
   * */
  status: 'success';

  /** Authentication payload. */
  data: AuthenticationPayloadDto;
}
