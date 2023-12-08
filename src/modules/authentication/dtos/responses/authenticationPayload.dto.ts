import { User } from '../../../user/models/user/user.entity';

export interface AuthenticationPayloadDto {
  /**
   * User entity.
   */
  user: User;

  /**
   * Authentication payload.
   *
   */
  payload: {
    /** type */
    type: string;
    /** token */
    token: string;
    /** refresh token */
    refreshToken?: string;
  };
}
