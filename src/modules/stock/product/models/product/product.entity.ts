import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from '../../../brand/models/brand/brand.entity';
import { Category } from '../../../category/models/category/category.entity';
import { ProductImage } from '../../../product-image/models/product-image/product-image.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  model: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
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

  @Column({ type: 'uuid', nullable: false })
  brandId: string;

  @ManyToOne(() => Brand, (brand) => brand.products, {
    nullable: false,
  })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ type: 'uuid', nullable: false })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true, // TODO:
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToMany(() => ProductImage, (image) => image.product, {
    // cascade: ['insert', 'remove', 'soft-remove', 'update', 'recover'],
  })
  images: ProductImage[];
}
