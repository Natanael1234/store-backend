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
import { Product } from '../../../product/models/product/product.entity';

@Entity({ name: 'products_images' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: false })
  image: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @Column({ nullable: false, default: false })
  active: boolean;

  @Column({ nullable: false, default: false })
  main: boolean;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: false })
  productId: string;

  @ManyToOne(() => Product, (product) => product.images, {
    nullable: false,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
