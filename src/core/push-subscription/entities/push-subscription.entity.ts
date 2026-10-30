import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from 'typeorm';
import { User } from '~/core/user/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.push_subscriptions, {
        onDelete: 'CASCADE',
    })
    user: Relation<User>;

    @Column({ type: 'text', unique: true })
    endpoint: string;

    @Column({ type: 'text' })
    p256dh: string;

    @Column({ type: 'text' })
    auth: string;

    @Column({ type: 'timestamptz', nullable: true })
    expirationTime: Date | null;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;
}
