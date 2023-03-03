import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/modules/user/models/user.entity';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../models/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository extends Repository<RefreshTokenEntity> {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    repository: Repository<RefreshTokenEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async createRefreshToken(user: UserEntity, ttl: number) {
    const token = new RefreshTokenEntity();

    token.id = user.id;
    token.revoked = false;

    const expiration = new Date();
    expiration.setTime(expiration.getTime() + ttl);

    token.expiresAt = expiration;

    return this.save(token);
  }

  public async findTokenById(id: number): Promise<RefreshTokenEntity | null> {
    return this.findOne({ where: { id } });
  }
}
