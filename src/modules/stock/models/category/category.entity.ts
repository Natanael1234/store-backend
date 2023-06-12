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
import { ProductEntity } from '../product/product.entity';

@Entity({ name: 'categories' })
@Tree('closure-table', {})
export class CategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

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
  parent: CategoryEntity;

  @TreeChildren()
  children: CategoryEntity[];

  @OneToMany(() => ProductEntity, (category) => category.category)
  products: ProductEntity[];
}
