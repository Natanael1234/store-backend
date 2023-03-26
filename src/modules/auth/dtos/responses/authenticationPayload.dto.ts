import { UserEntity } from '../../../user/models/user/user.entity';

export interface AuthenticationPayloadDto {
  user: UserEntity;
  payload: {
    type: string;
    token: string;
    refresh_token?: string;
  };
}
