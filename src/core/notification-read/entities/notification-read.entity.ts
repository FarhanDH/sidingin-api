import {
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from 'typeorm';
import { Notification } from '~/core/notification/entities/notification.entity';
import { User } from '~/core/user/entities/user.entity';

@Entity('notification_reads')
export class NotificationRead {
    @PrimaryGeneratedColumn('increment')
    id: number;

    /**
     * Relations
     */
    @ManyToOne(() => Notification, (notification) => notification.reads)
    notification: Relation<Notification>;

    @ManyToOne(() => User, (user) => user.notification_reads)
    user: Relation<User>;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    read_at: Date;
}
