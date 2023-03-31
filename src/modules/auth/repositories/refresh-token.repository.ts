import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { UserEntity } from '../../user/models/user/user.entity';
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
      throw new Error('User is required');
    }
    if (!user.id) {
      throw new Error('User id is required');
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
    if (id == null) throw new Error('User id is required');
    const refreshToken = await this.findOne({ where: { id } });
    if (!refreshToken) throw new NotFoundException('Refresh token not found');
    return refreshToken;
  }
}
