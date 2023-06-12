import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { UserMessage } from '../../user/enums/messages/user/user-messages.ts/user-messages.enum';
import { UserEntity } from '../../user/models/user/user.entity';
import { RefreshTokenMessage } from '../enums/refresh-token-messages.ts/refresh-token-messages.enum';
import { RefreshTokenEntity } from '../models/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshTokenEntity> {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    repository: Repository<RefreshTokenEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createRefreshToken(user: UserEntity, ttl: number) {
    if (!user) {
      throw new Error(UserMessage.REQUIRED);
    }
    if (!user.id) {
      throw new Error(UserMessage.ID_REQUIRED);
    }
    if (ttl == null) {
      throw new Error('ttl is required');
    }
    const token = new RefreshTokenEntity();
    // TODO: está sempre sobrescrevendo o token
    token.revoked = false;
    token.userId = user.id;
    const currentTime = new Date();
    const expirationTime = currentTime.getTime() + ttl;
    currentTime.setTime(expirationTime);
    token.expiresAt = currentTime;
    return this.save(token);
  }

  public async findTokenById(id: number): Promise<RefreshTokenEntity | null> {
    if (id == null) throw new Error(UserMessage.ID_REQUIRED);
    const refreshToken = await this.findOne({ where: { id } });
    if (!refreshToken)
      throw new NotFoundException(RefreshTokenMessage.NOT_FOUND);
    return refreshToken;
  }
}
