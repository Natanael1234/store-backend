import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  // TODO:  usar bcrypt https://github.com/kelektiv/node.bcrypt.js#readme
  @Column()
  password: string;
}
