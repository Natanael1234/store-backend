import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../authentication/enums/role/role.enum';
import { EncryptedDataDto } from '../../../system/encryption/dtos/encrypted-data.dto';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({
    // type: DatabaseConfig.DB_TYPE == 'sqlite' ? 'simple-json' : 'json',
    type: 'simple-json',
    select: false,
  })
  hash: EncryptedDataDto;

  @Column({ type: 'simple-json', nullable: false })
  roles: Role[];

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
