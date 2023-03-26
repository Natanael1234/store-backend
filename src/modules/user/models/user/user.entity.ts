import { EncryptedDataDto } from '../../../system/encryption/dtos/encrypted-data.dto';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({
    // type: DatabaseConfig.DB_TYPE == 'sqlite' ? 'simple-json' : 'json',
    type: 'simple-json',
    select: false,
  })
  hash: EncryptedDataDto;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
