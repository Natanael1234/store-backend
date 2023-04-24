import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../modules/authentication/models/refresh-token.entity';
import { RefreshTokenRepository } from '../modules/authentication/repositories/refresh-token.repository';
import { BrandEntity } from '../modules/stock/models/brand/brand.entity';
import { ProductEntity } from '../modules/stock/models/product/product.entity';
import { UserEntity } from '../modules/user/models/user/user.entity';

export type TestDatabaseSnapshot = {
  users: UserEntity[];
  refreshTokens: RefreshTokenEntity[];
  products: ProductEntity[];
  brands: BrandEntity[];
};

export type TestDatabaseSnapshotDiff = {
  users: UserEntity[];
  refreshTokens: RefreshTokenEntity[];
  products: ProductEntity[];
  brands: BrandEntity[];

  alteredUsers: boolean;
  alteredRefreshTokens: boolean;
  alteredProducts: boolean;
  alteredBrands: boolean;

  alteredDatabase: boolean;
};

export class TestDatabaseUtils {
  userRepo: Repository<UserEntity>;
  refreshTokenRepo: RefreshTokenRepository;
  productRepo: Repository<ProductEntity>;
  brandRepo: Repository<BrandEntity>;
  lastSnapshot: TestDatabaseSnapshot;
  diffs: TestDatabaseSnapshotDiff[] = [];

  constructor(public readonly appSource: INestApplication | TestingModule) {
    this.userRepo = appSource.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );

    this.productRepo = appSource.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );

    this.brandRepo = appSource.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );

    this.refreshTokenRepo = appSource.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
  }

  async checkChanges() {
    const before = this.lastSnapshot;
    const after = await this.getDatabaseSnapshot();
    const diff = this.getDiff(this.lastSnapshot, after);
    let alteredTables = [];
    if (diff.alteredUsers) alteredTables.push('user');
    if (diff.alteredRefreshTokens) alteredTables.push('refreshTokens');
    if (diff.alteredBrands) alteredTables.push('brands');
    if (diff.alteredProducts) alteredTables.push('products');

    this.lastSnapshot = after;
    this.diffs.push(diff);
    return {
      before,
      after,
      diff,
      alteredDatabase: diff.alteredDatabase,
      alteredTables,
    };
  }

  async reset() {
    await this.checkChanges();
  }

  private async getDatabaseSnapshot(): Promise<TestDatabaseSnapshot> {
    return {
      users: await this.userRepo.find(),
      refreshTokens: [],
      products: await this.productRepo.find({ relations: { brand: true } }),
      brands: await this.brandRepo.find(),
    };
  }

  private getDiff(
    snapshot1: TestDatabaseSnapshot,
    snapshot2: TestDatabaseSnapshot,
  ): TestDatabaseSnapshotDiff {
    const diff: TestDatabaseSnapshotDiff = {
      users: [],
      refreshTokens: [],
      brands: [],
      products: [],
      alteredUsers: false,
      alteredRefreshTokens: false,
      alteredBrands: false,
      alteredProducts: false,
      alteredDatabase: false,
    };
    if (!snapshot1) {
      snapshot1 = { users: [], refreshTokens: [], products: [], brands: [] };
    }
    if (JSON.stringify(snapshot1.users) != JSON.stringify(snapshot2.users)) {
      diff.users = snapshot2.users;
      diff.alteredUsers = true;
      diff.alteredDatabase = true;
    }
    if (
      JSON.stringify(snapshot1.refreshTokens) !=
      JSON.stringify(snapshot2.refreshTokens)
    ) {
      diff.refreshTokens = snapshot2.refreshTokens;
      diff.alteredRefreshTokens = true;
      diff.alteredDatabase = true;
    }
    if (JSON.stringify(snapshot1.brands) != JSON.stringify(snapshot2.brands)) {
      diff.brands = snapshot2.brands;
      diff.alteredBrands = true;
      diff.alteredDatabase = true;
    }
    if (
      JSON.stringify(snapshot1.products) != JSON.stringify(snapshot2.products)
    ) {
      diff.products = snapshot2.products;
      diff.alteredProducts = true;
      diff.alteredDatabase = true;
    }
    return diff;
  }
}
