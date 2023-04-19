import { UserEntity } from '../../../user/models/user/user.entity';

export interface AuthenticationPayloadDto {
  user: UserEntity;
  payload: {
    type: string;
    token: string;
    refreshToken?: string;
  };
}
