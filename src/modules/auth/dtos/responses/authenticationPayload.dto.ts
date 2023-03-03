import { UserEntity } from 'src/modules/user/models/user.entity';

export interface AuthenticationPayloadDto {
  user: UserEntity;
  payload: {
    type: string;
    token: string;
    refresh_token?: string;
  };
}
