import { AuthenticationPayloadDto } from './authenticationPayload.dto';

export class RefreshResponseDto {
  /**
   * Status.
   * @example 'success'
   */
  public status: 'success';

  /** Authentication payload. */
  public data: AuthenticationPayloadDto;
}
