import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from '../brand/brand.entity';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  model: string;

  @Column({ nullable: false })
  price: number;

  @Column({ nullable: false, default: 0 })
  quantityInStock: number;

  @Column({ nullable: false, default: false })
  active: boolean;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'int', nullable: false })
  brandId: number;

  @ManyToOne(() => BrandEntity, (brand) => brand.products, {
    nullable: false,
  })
  @JoinColumn({ name: 'brandId' })
  brand: BrandEntity;
}
