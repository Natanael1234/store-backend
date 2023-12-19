import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  revoked: boolean;

  // @Column({ type: 'timestamptz' })
  @Column({})
  expiresAt: Date;

  @Column({})
  userId: string;
}
