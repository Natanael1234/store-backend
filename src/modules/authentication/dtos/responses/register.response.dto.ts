import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class RegisterResponseDto {
  /**
   * Status.
   * @example 'success'
   */
  status: 'success';

  /** Authentication payload. */
  data: AuthenticationPayloadDto;
}
