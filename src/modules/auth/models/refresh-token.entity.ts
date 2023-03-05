import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity {
  @PrimaryColumn()
  id: number;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
