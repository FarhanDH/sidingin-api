import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { User } from '~/core/user/entities/user.entity';

@Entity('otp_token')
export class OtpToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.otp_tokens)
  user: Relation<User>;

  @Column({ type: 'varchar', length: 4 })
  @Index()
  otpCode: string;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ default: false })
  is_used: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
