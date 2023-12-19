import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../../product/models/product/product.entity';

@Entity({ name: 'categories' })
@Tree('closure-table', {})
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: false })
  active: boolean;

  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @TreeParent()
  parent: Category;

  @TreeChildren()
  children: Category[];

  @OneToMany(() => Product, (category) => category.category)
  products: Product[];
}
